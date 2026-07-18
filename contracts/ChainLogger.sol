// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ChainLogger
 * @dev Post-receipt fund transparency tracker
 * @notice Records donation receipts, fund allocations, invoices, and evidence hashes on Polygon
 */
contract ChainLogger is AccessControl, Pausable, ReentrancyGuard {

    // ─── Role Definitions ────────────────────────────────────────────
    bytes32 public constant FINANCE_ROLE = keccak256("FINANCE_ROLE");
    bytes32 public constant VENDOR_ROLE  = keccak256("VENDOR_ROLE");
    bytes32 public constant VIEWER_ROLE  = keccak256("VIEWER_ROLE");
    bytes32 public constant ADMIN_ROLE   = keccak256("ADMIN_ROLE");

    // ─── Status Enums ────────────────────────────────────────────────
    enum ReceiptStatus { Recorded, Allocated, Refunded }
    enum ProjectStatus { Active, Completed, Cancelled }
    enum InvoiceStatus { Submitted, UnderReview, Approved, Rejected, Paid }
    enum EvidenceStatus { Uploaded, Verified, Rejected }

    // ─── Structs ─────────────────────────────────────────────────────
    struct Receipt {
        uint256     id;
        address     donor;           // bank verifier / donor address
        uint256     amountUSD;       // amount in USD cents (to avoid floats)
        string      donorName;       // donor name
        string      bankReference;  // bank transaction reference
        string      bankTxHash;      // bank transaction identifier
        uint256     createdAt;
        ReceiptStatus status;
        bool        exists;
    }

    struct Project {
        uint256          id;
        string           name;
        string           description;
        string           ipfsCid;        // project charter / details
        address          manager;        // project lead
        uint256          totalAllocated; // in USD cents
        uint256          totalSpent;     // in USD cents
        uint256          createdAt;
        uint256          updatedAt;
        ProjectStatus    status;
        bool             exists;
    }

    struct Allocation {
        uint256   id;
        uint256   receiptId;     // which receipt this came from
        uint256   projectId;     // which project this funds
        uint256   amountUSD;     // in USD cents
        string    purpose;
        uint256   createdAt;
        bool      exists;
    }

    struct Invoice {
        uint256        id;
        uint256        allocationId;   // linked allocation
        address        vendor;         // who submitted
        string         vendorName;
        uint256        amountUSD;      // in USD cents
        string         invoiceHash;    // SHA-256 of the invoice document
        string         ipfsCid;        // IPFS CID of the invoice document
        string         description;
        uint256        submittedAt;
        uint256        reviewedAt;
        address        reviewedBy;
        InvoiceStatus  status;
        string         rejectionReason;
        bool           exists;
    }

    struct Evidence {
        uint256         id;
        uint256         invoiceId;      // linked invoice (0 = general project evidence)
        address         uploadedBy;
        string          evidenceHash;   // SHA-256 of the evidence file
        string          ipfsCid;        // IPFS CID of the evidence file
        string          fileName;
        string          fileType;       // "image/jpeg", "application/pdf", etc.
        uint256         fileSizeBytes;
        uint256         uploadedAt;
        uint256         verifiedAt;
        address         verifiedBy;
        EvidenceStatus  status;
        string          verificationNote;
        bool            exists;
    }

    // ─── State ───────────────────────────────────────────────────────
    uint256 private _nextReceiptId;
    uint256 private _nextProjectId;
    uint256 private _nextAllocationId;
    uint256 private _nextInvoiceId;
    uint256 private _nextEvidenceId;

    // Per-receipt allocated totals (avoids O(n) scan in allocateFunds)
    mapping(uint256 => uint256) private _receiptAllocatedTotals;

    // Per-project invoice index (avoids O(n) scan in getProjectInvoices)
    mapping(uint256 => uint256[]) private _projectInvoices;

    // Per-vendor invoice index (avoids O(n) scan for vendor dashboards)
    mapping(address => uint256[]) private _vendorInvoices;

    mapping(uint256 => Receipt)   public receipts;
    mapping(uint256 => Project)   public projects;
    mapping(uint256 => Allocation) public allocations;
    mapping(uint256 => Invoice)   public invoices;
    mapping(uint256 => Evidence)  public evidences;

    // ─── Custom Errors (gas savings vs require strings) ─────────────
    error ZeroAddress();
    error ProjectDoesNotExist();
    error ReceiptDoesNotExist();
    error AllocationDoesNotExist();
    error InvoiceDoesNotExist();
    error EvidenceDoesNotExist();
    error ProjectNotActive();
    error InvalidInvoiceStatus();
    error InvalidEvidenceStatus();
    error InvoiceNotApproved();
    error InsufficientFunds();
    error InvalidAmount();
    error InvalidHashLength();
    error EmptyString();
    error InvalidFileSize();

    // ─── Events ──────────────────────────────────────────────────────
    event ReceiptRecorded(
        uint256 indexed receiptId,
        address indexed donor,
        uint256 amountUSD,
        string bankReference
    );

    event ProjectCreated(
        uint256 indexed projectId,
        address indexed manager,
        string name
    );

    event FundAllocated(
        uint256 indexed allocationId,
        uint256 indexed receiptId,
        uint256 indexed projectId,
        uint256 amountUSD
    );

    event InvoiceSubmitted(
        uint256 indexed invoiceId,
        uint256 indexed allocationId,
        address indexed vendor,
        uint256 amountUSD,
        string invoiceHash
    );

    event InvoiceStatusUpdated(
        uint256 indexed invoiceId,
        InvoiceStatus status,
        address indexed updatedBy
    );

    event EvidenceUploaded(
        uint256 indexed evidenceId,
        uint256 indexed invoiceId,
        address indexed uploader,
        string evidenceHash,
        string ipfsCid
    );

    event EvidenceStatusUpdated(
        uint256 indexed evidenceId,
        EvidenceStatus status,
        address indexed updatedBy
    );

    event ProjectStatusUpdated(
        uint256 indexed projectId,
        ProjectStatus status,
        address indexed updatedBy
    );

    // ─── Modifiers ───────────────────────────────────────────────────
    modifier onlyExistingProject(uint256 _projectId) {
        if (!projects[_projectId].exists) revert ProjectDoesNotExist();
        _;
    }

    modifier onlyExistingReceipt(uint256 _receiptId) {
        if (!receipts[_receiptId].exists) revert ReceiptDoesNotExist();
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────
    constructor(address _admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(FINANCE_ROLE, _admin);
    }

    // ─── Role Management ─────────────────────────────────────────────
    function addFinance(address _account) external onlyRole(ADMIN_ROLE) nonReentrant {
        grantRole(FINANCE_ROLE, _account);
    }

    function addVendor(address _account) external onlyRole(ADMIN_ROLE) nonReentrant {
        grantRole(VENDOR_ROLE, _account);
    }

    function addViewer(address _account) external onlyRole(ADMIN_ROLE) nonReentrant {
        grantRole(VIEWER_ROLE, _account);
    }

    function removeFinance(address _account) external onlyRole(ADMIN_ROLE) nonReentrant {
        revokeRole(FINANCE_ROLE, _account);
    }

    function removeVendor(address _account) external onlyRole(ADMIN_ROLE) nonReentrant {
        revokeRole(VENDOR_ROLE, _account);
    }

    // ─── Step 1: Record Donation Receipt ─────────────────────────────
    /**
     * @notice Records a new donation receipt after funds hit the bank account
     * @param _donorName Name of the donor
     * @param _amountUSD Amount received in USD cents (e.g. $5000.00 = 500000)
     * @param _reference Bank transaction reference number
     * @param _bankTxHash Bank's transaction identifier
     */
    function recordReceipt(
        string calldata _donorName,
        uint256 _amountUSD,
        string calldata _reference,
        string calldata _bankTxHash
    ) external onlyRole(FINANCE_ROLE) whenNotPaused nonReentrant returns (uint256) {
        if (_amountUSD == 0) revert InvalidAmount();
        if (bytes(_reference).length == 0) revert EmptyString();
        if (bytes(_bankTxHash).length == 0) revert EmptyString();

        uint256 receiptId = _nextReceiptId++;
        receipts[receiptId] = Receipt({
            id:          receiptId,
            donor:       msg.sender,
            amountUSD:   _amountUSD,
            donorName:   _donorName,
            bankReference: _reference,
            bankTxHash:  _bankTxHash,
            createdAt:   block.timestamp,
            status:      ReceiptStatus.Recorded,
            exists:      true
        });

        emit ReceiptRecorded(receiptId, msg.sender, _amountUSD, _reference);
        return receiptId;
    }

    // ─── Step 2: Create Project ──────────────────────────────────────
    /**
     * @notice Creates a new project to receive funds
     * @param _name Project name
     * @param _description Project description
     * @param _ipfsCid IPFS CID of the project charter/document
     */
    function createProject(
        string calldata _name,
        string calldata _description,
        string calldata _ipfsCid
    ) external onlyRole(FINANCE_ROLE) whenNotPaused nonReentrant returns (uint256) {
        if (bytes(_name).length == 0) revert EmptyString();
        if (bytes(_ipfsCid).length == 0) revert EmptyString();

        uint256 projectId = _nextProjectId++;
        projects[projectId] = Project({
            id:             projectId,
            name:           _name,
            description:    _description,
            ipfsCid:        _ipfsCid,
            manager:        msg.sender,
            totalAllocated: 0,
            totalSpent:     0,
            createdAt:      block.timestamp,
            updatedAt:      block.timestamp,
            status:         ProjectStatus.Active,
            exists:         true
        });

        emit ProjectCreated(projectId, msg.sender, _name);
        return projectId;
    }

    // ─── Step 3: Allocate Funds to Project ───────────────────────────
    /**
     * @notice Allocates funds from a receipt to a specific project
     * @param _receiptId Source receipt ID
     * @param _projectId Target project ID
     * @param _amountUSD Amount to allocate in USD cents
     * @param _purpose Purpose of allocation
     */
    function allocateFunds(
        uint256 _receiptId,
        uint256 _projectId,
        uint256 _amountUSD,
        string calldata _purpose
    ) external onlyRole(FINANCE_ROLE) whenNotPaused nonReentrant returns (uint256) {
        if (!receipts[_receiptId].exists) revert ReceiptDoesNotExist();
        if (!projects[_projectId].exists) revert ProjectDoesNotExist();
        if (projects[_projectId].status != ProjectStatus.Active) revert ProjectNotActive();
        if (_amountUSD == 0) revert InvalidAmount();
        if (bytes(_purpose).length == 0) revert EmptyString();

        // Check available balance using tracked total (O(1) instead of O(n))
        uint256 allocatedSoFar = _receiptAllocatedTotals[_receiptId];
        uint256 available = receipts[_receiptId].amountUSD - allocatedSoFar;
        if (_amountUSD > available) revert InsufficientFunds();

        uint256 allocationId = _nextAllocationId++;
        allocations[allocationId] = Allocation({
            id:          allocationId,
            receiptId:   _receiptId,
            projectId:   _projectId,
            amountUSD:   _amountUSD,
            purpose:     _purpose,
            createdAt:   block.timestamp,
            exists:      true
        });

        // Update tracked totals
        _receiptAllocatedTotals[_receiptId] += _amountUSD;
        projects[_projectId].totalAllocated += _amountUSD;
        projects[_projectId].updatedAt = block.timestamp;

        if (allocatedSoFar + _amountUSD >= receipts[_receiptId].amountUSD) {
            receipts[_receiptId].status = ReceiptStatus.Allocated;
        }

        emit FundAllocated(allocationId, _receiptId, _projectId, _amountUSD);
        return allocationId;
    }

    // ─── Step 4: Vendor Submits Invoice ──────────────────────────────
    /**
     * @notice Vendor submits an invoice for a specific allocation
     * @param _allocationId Allocation to bill against
     * @param _vendorName Vendor name
     * @param _amountUSD Invoice amount in USD cents
     * @param _invoiceHash SHA-256 hash of the invoice document
     * @param _ipfsCid IPFS CID of the invoice document
     * @param _description Invoice description
     */
    function submitInvoice(
        uint256 _allocationId,
        string calldata _vendorName,
        uint256 _amountUSD,
        string calldata _invoiceHash,
        string calldata _ipfsCid,
        string calldata _description
    ) external onlyRole(VENDOR_ROLE) whenNotPaused nonReentrant returns (uint256) {
        if (!allocations[_allocationId].exists) revert AllocationDoesNotExist();
        if (_amountUSD == 0) revert InvalidAmount();
        if (bytes(_invoiceHash).length != 64) revert InvalidHashLength();
        if (bytes(_ipfsCid).length == 0) revert EmptyString();
        if (bytes(_description).length == 0) revert EmptyString();

        uint256 invoiceId = _nextInvoiceId++;
        invoices[invoiceId] = Invoice({
            id:           invoiceId,
            allocationId: _allocationId,
            vendor:       msg.sender,
            vendorName:   _vendorName,
            amountUSD:    _amountUSD,
            invoiceHash:  _invoiceHash,
            ipfsCid:      _ipfsCid,
            description:  _description,
            submittedAt:  block.timestamp,
            reviewedAt:   0,
            reviewedBy:   address(0),
            status:       InvoiceStatus.Submitted,
            rejectionReason: "",
            exists:       true
        });

        // Maintain per-project and per-vendor invoice indices for O(1) queries
        uint256 projId = allocations[_allocationId].projectId;
        _projectInvoices[projId].push(invoiceId);
        _vendorInvoices[msg.sender].push(invoiceId);

        emit InvoiceSubmitted(invoiceId, _allocationId, msg.sender, _amountUSD, _invoiceHash);
        return invoiceId;
    }

    // ─── Invoice Review Actions ──────────────────────────────────────
    function approveInvoice(uint256 _invoiceId) external onlyRole(FINANCE_ROLE) nonReentrant {
        if (!invoices[_invoiceId].exists) revert InvoiceDoesNotExist();
        if (invoices[_invoiceId].status != InvoiceStatus.Submitted) revert InvalidInvoiceStatus();

        invoices[_invoiceId].status = InvoiceStatus.Approved;
        invoices[_invoiceId].reviewedAt = block.timestamp;
        invoices[_invoiceId].reviewedBy = msg.sender;

        // Update project spent total
        uint256 projectId = allocations[invoices[_invoiceId].allocationId].projectId;
        projects[projectId].totalSpent += invoices[_invoiceId].amountUSD;
        projects[projectId].updatedAt = block.timestamp;

        emit InvoiceStatusUpdated(_invoiceId, InvoiceStatus.Approved, msg.sender);
    }

    function rejectInvoice(
        uint256 _invoiceId,
        string calldata _reason
    ) external onlyRole(FINANCE_ROLE) nonReentrant {
        if (!invoices[_invoiceId].exists) revert InvoiceDoesNotExist();
        if (invoices[_invoiceId].status != InvoiceStatus.Submitted) revert InvalidInvoiceStatus();
        if (bytes(_reason).length == 0) revert EmptyString();

        invoices[_invoiceId].status = InvoiceStatus.Rejected;
        invoices[_invoiceId].reviewedAt = block.timestamp;
        invoices[_invoiceId].reviewedBy = msg.sender;
        invoices[_invoiceId].rejectionReason = _reason;

        emit InvoiceStatusUpdated(_invoiceId, InvoiceStatus.Rejected, msg.sender);
    }

    function markInvoicePaid(uint256 _invoiceId) external onlyRole(FINANCE_ROLE) nonReentrant {
        if (!invoices[_invoiceId].exists) revert InvoiceDoesNotExist();
        if (invoices[_invoiceId].status != InvoiceStatus.Approved) revert InvoiceNotApproved();

        invoices[_invoiceId].status = InvoiceStatus.Paid;
        emit InvoiceStatusUpdated(_invoiceId, InvoiceStatus.Paid, msg.sender);
    }

    // ─── Step 5: Upload Evidence ─────────────────────────────────────
    /**
     * @notice Uploads evidence linked to an invoice (or directly to a project)
     * @param _invoiceId Invoice ID (0 for project-level evidence)
     * @param _evidenceHash SHA-256 hash of the evidence file
     * @param _ipfsCid IPFS CID of the evidence file
     * @param _fileName Original filename
     * @param _fileType MIME type
     * @param _fileSizeBytes File size in bytes
     */
    function uploadEvidence(
        uint256 _invoiceId,
        string calldata _evidenceHash,
        string calldata _ipfsCid,
        string calldata _fileName,
        string calldata _fileType,
        uint256 _fileSizeBytes
    ) external onlyRole(VENDOR_ROLE) whenNotPaused nonReentrant returns (uint256) {
        // invoiceId can be 0 for project-level evidence; otherwise must exist
        if (_invoiceId > 0) {
            if (!invoices[_invoiceId].exists) revert InvoiceDoesNotExist();
        }

        if (bytes(_evidenceHash).length != 64) revert InvalidHashLength();
        if (bytes(_ipfsCid).length == 0) revert EmptyString();
        if (bytes(_fileName).length == 0) revert EmptyString();
        if (_fileSizeBytes == 0) revert InvalidFileSize();

        uint256 evidenceId = _nextEvidenceId++;
        evidences[evidenceId] = Evidence({
            id:              evidenceId,
            invoiceId:       _invoiceId,
            uploadedBy:      msg.sender,
            evidenceHash:    _evidenceHash,
            ipfsCid:         _ipfsCid,
            fileName:        _fileName,
            fileType:        _fileType,
            fileSizeBytes:   _fileSizeBytes,
            uploadedAt:      block.timestamp,
            verifiedAt:      0,
            verifiedBy:      address(0),
            status:          EvidenceStatus.Uploaded,
            verificationNote: "",
            exists:          true
        });

        emit EvidenceUploaded(evidenceId, _invoiceId, msg.sender, _evidenceHash, _ipfsCid);
        return evidenceId;
    }

    function verifyEvidence(
        uint256 _evidenceId,
        string calldata _note
    ) external onlyRole(FINANCE_ROLE) nonReentrant {
        if (!evidences[_evidenceId].exists) revert EvidenceDoesNotExist();
        if (evidences[_evidenceId].status != EvidenceStatus.Uploaded) revert InvalidEvidenceStatus();

        evidences[_evidenceId].status = EvidenceStatus.Verified;
        evidences[_evidenceId].verifiedAt = block.timestamp;
        evidences[_evidenceId].verifiedBy = msg.sender;
        if (bytes(_note).length > 0) {
            evidences[_evidenceId].verificationNote = _note;
        }

        emit EvidenceStatusUpdated(_evidenceId, EvidenceStatus.Verified, msg.sender);
    }

    function rejectEvidence(
        uint256 _evidenceId,
        string calldata _reason
    ) external onlyRole(FINANCE_ROLE) nonReentrant {
        if (!evidences[_evidenceId].exists) revert EvidenceDoesNotExist();
        if (evidences[_evidenceId].status != EvidenceStatus.Uploaded) revert InvalidEvidenceStatus();
        if (bytes(_reason).length == 0) revert EmptyString();

        evidences[_evidenceId].status = EvidenceStatus.Rejected;
        evidences[_evidenceId].verifiedAt = block.timestamp;
        evidences[_evidenceId].verifiedBy = msg.sender;
        evidences[_evidenceId].verificationNote = _reason;

        emit EvidenceStatusUpdated(_evidenceId, EvidenceStatus.Rejected, msg.sender);
    }

    // ─── Admin / Lifecycle ───────────────────────────────────────────
    function cancelProject(uint256 _projectId) external onlyRole(FINANCE_ROLE) onlyExistingProject(_projectId) nonReentrant {
        if (projects[_projectId].status != ProjectStatus.Active) revert ProjectNotActive();
        projects[_projectId].status = ProjectStatus.Cancelled;
        projects[_projectId].updatedAt = block.timestamp;
        emit ProjectStatusUpdated(_projectId, ProjectStatus.Cancelled, msg.sender);
    }

    function completeProject(uint256 _projectId) external onlyRole(FINANCE_ROLE) onlyExistingProject(_projectId) nonReentrant {
        if (projects[_projectId].status != ProjectStatus.Active) revert ProjectNotActive();
        projects[_projectId].status = ProjectStatus.Completed;
        projects[_projectId].updatedAt = block.timestamp;
        emit ProjectStatusUpdated(_projectId, ProjectStatus.Completed, msg.sender);
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    // ─── Read Helpers ────────────────────────────────────────────────
    function getReceipt(uint256 _receiptId) public view returns (Receipt memory) {
        if (!receipts[_receiptId].exists) revert ReceiptDoesNotExist();
        return receipts[_receiptId];
    }

    function getProject(uint256 _projectId) public view returns (Project memory) {
        if (!projects[_projectId].exists) revert ProjectDoesNotExist();
        return projects[_projectId];
    }

    function getAllocation(uint256 _allocationId) public view returns (Allocation memory) {
        if (!allocations[_allocationId].exists) revert AllocationDoesNotExist();
        return allocations[_allocationId];
    }

    function getInvoice(uint256 _invoiceId) public view returns (Invoice memory) {
        if (!invoices[_invoiceId].exists) revert InvoiceDoesNotExist();
        return invoices[_invoiceId];
    }

    function getEvidence(uint256 _evidenceId) public view returns (Evidence memory) {
        if (!evidences[_evidenceId].exists) revert EvidenceDoesNotExist();
        return evidences[_evidenceId];
    }

    function getProjectAllocations(uint256 _projectId) public view returns (uint256[] memory) {
        if (!projects[_projectId].exists) revert ProjectDoesNotExist();
        uint256[] memory result;
        uint256 count = 0;

        // First pass: count
        for (uint256 i = 0; i < _nextAllocationId; i++) {
            if (allocations[i].exists && allocations[i].projectId == _projectId) {
                count++;
            }
        }

        result = new uint256[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < _nextAllocationId; i++) {
            if (allocations[i].exists && allocations[i].projectId == _projectId) {
                result[idx++] = i;
            }
        }
        return result;
    }

    function getProjectInvoices(uint256 _projectId) external view returns (uint256[] memory) {
        if (!projects[_projectId].exists) revert ProjectDoesNotExist();
        return _projectInvoices[_projectId];
    }

    function getReceiptAllocations(uint256 _receiptId) external view returns (uint256[] memory) {
        if (!receipts[_receiptId].exists) revert ReceiptDoesNotExist();
        uint256 count = 0;
        for (uint256 i = 0; i < _nextAllocationId; i++) {
            if (allocations[i].exists && allocations[i].receiptId == _receiptId) {
                count++;
            }
        }

        uint256[] memory result = new uint256[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < _nextAllocationId; i++) {
            if (allocations[i].exists && allocations[i].receiptId == _receiptId) {
                result[idx++] = i;
            }
        }
        return result;
    }

    function getTotalReceipts() external view returns (uint256) {
        return _nextReceiptId;
    }

    function getTotalProjects() external view returns (uint256) {
        return _nextProjectId;
    }

    function getTotalAllocations() external view returns (uint256) {
        return _nextAllocationId;
    }

    function getTotalInvoices() external view returns (uint256) {
        return _nextInvoiceId;
    }

    function getTotalEvidences() external view returns (uint256) {
        return _nextEvidenceId;
    }

    function getVendorInvoices(address _vendor) external view returns (uint256[] memory) {
        return _vendorInvoices[_vendor];
    }
}
