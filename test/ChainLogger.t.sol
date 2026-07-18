// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../contracts/ChainLogger.sol";

contract ChainLoggerTest is Test {
    ChainLogger public chainLogger;

    // Test accounts
    address public admin;
    address public finance;
    address public vendor;
    address public viewer;

    // Constants
    uint256 constant AMOUNT_100 = 10000; // $100.00 in cents
    uint256 constant AMOUNT_50 = 5000;   // $50.00 in cents
    uint256 constant AMOUNT_30 = 3000;   // $30.00 in cents
    uint256 constant AMOUNT_20 = 2000;   // $20.00 in cents
    string constant BANK_REF = "TXN-2024-001";
    string constant BANK_TX_HASH = "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
    string constant INVOICE_HASH = "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    string constant IPFS_CID = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdSSx8ihFWzHA7U";

    function setUp() public {
        admin = address(this);
        finance = makeAddr("finance");
        vendor = makeAddr("vendor");
        viewer = makeAddr("viewer");

        vm.prank(admin);
        chainLogger = new ChainLogger(admin);

        vm.prank(admin);
        chainLogger.addFinance(finance);

        vm.prank(admin);
        chainLogger.addVendor(vendor);

        vm.prank(admin);
        chainLogger.addViewer(viewer);
    }

    // ─── Roles ──────────────────────────────────────────────────────

    function test_DeployerGetsAdminAndFinanceRoles() public {
        vm.prank(admin);
        chainLogger.addFinance(vendor);
    }

    function test_NonAdminCannotAddFinance() public {
        vm.prank(finance);
        vm.expectRevert();
        chainLogger.addFinance(vendor);
    }

    // ─── Receipts ──────────────────────────────────────────────────

    function test_FinanceCanRecordReceipt() public {
        vm.prank(finance);
        uint256 receiptId = chainLogger.recordReceipt(
            "Test Donor",
            AMOUNT_100,
            BANK_REF,
            BANK_TX_HASH
        );

        assertEq(receiptId, 0);
        assertEq(chainLogger.getTotalReceipts(), 1);

        ChainLogger.Receipt memory receipt = chainLogger.getReceipt(0);
        assertEq(receipt.donorName, "Test Donor");
        assertEq(receipt.amountUSD, AMOUNT_100);
        assertEq(receipt.bankReference, BANK_REF);
        assertEq(receipt.bankTxHash, BANK_TX_HASH);
        assertEq(uint256(receipt.status), uint256(ChainLogger.ReceiptStatus.Recorded));
        assertTrue(receipt.exists);
    }

    function test_NonFinanceCannotRecordReceipt() public {
        vm.prank(vendor);
        vm.expectRevert();
        chainLogger.recordReceipt("Test", AMOUNT_100, BANK_REF, BANK_TX_HASH);
    }

    function test_RecordReceiptWithZeroAmountReverts() public {
        vm.prank(finance);
        vm.expectRevert(ChainLogger.InvalidAmount.selector);
        chainLogger.recordReceipt("Test", 0, BANK_REF, BANK_TX_HASH);
    }

    function test_RecordReceiptWithEmptyReferenceReverts() public {
        vm.prank(finance);
        vm.expectRevert(ChainLogger.EmptyString.selector);
        chainLogger.recordReceipt("Test", AMOUNT_100, "", BANK_TX_HASH);
    }

    function test_RecordReceiptWithEmptyBankTxHashReverts() public {
        vm.prank(finance);
        vm.expectRevert(ChainLogger.EmptyString.selector);
        chainLogger.recordReceipt("Test", AMOUNT_100, BANK_REF, "");
    }

    function test_ReceiptEventEmitted() public {
        vm.prank(finance);
        vm.expectEmit(true, false, false, true);
        emit ChainLogger.ReceiptRecorded(0, finance, AMOUNT_100, BANK_REF);
        chainLogger.recordReceipt("Test", AMOUNT_100, BANK_REF, BANK_TX_HASH);
    }

    function test_ReceiptCountersIncrement() public {
        vm.prank(finance);
        chainLogger.recordReceipt("D1", AMOUNT_100, BANK_REF, BANK_TX_HASH);
        vm.prank(finance);
        chainLogger.recordReceipt("D2", AMOUNT_100, BANK_REF, BANK_TX_HASH);

        assertEq(chainLogger.getTotalReceipts(), 2);
    }

    // ─── Projects ──────────────────────────────────────────────────

    function test_FinanceCanCreateProject() public {
        vm.prank(finance);
        uint256 projectId = chainLogger.createProject(
            "Test Project",
            "A test project description",
            IPFS_CID
        );

        assertEq(projectId, 0);
        assertEq(chainLogger.getTotalProjects(), 1);

        ChainLogger.Project memory project = chainLogger.getProject(0);
        assertEq(project.name, "Test Project");
        assertEq(project.description, "A test project description");
        assertEq(project.ipfsCid, IPFS_CID);
        assertEq(uint256(project.status), uint256(ChainLogger.ProjectStatus.Active));
        assertEq(project.totalAllocated, 0);
        assertEq(project.totalSpent, 0);
        assertTrue(project.exists);
    }

    function test_NonFinanceCannotCreateProject() public {
        vm.prank(vendor);
        vm.expectRevert();
        chainLogger.createProject("Test", "Desc", IPFS_CID);
    }

    function test_CreateProjectWithEmptyNameReverts() public {
        vm.prank(finance);
        vm.expectRevert(ChainLogger.EmptyString.selector);
        chainLogger.createProject("", "Desc", IPFS_CID);
    }

    function test_CreateProjectWithEmptyIPFSReverts() public {
        vm.prank(finance);
        vm.expectRevert(ChainLogger.EmptyString.selector);
        chainLogger.createProject("Test", "Desc", "");
    }

    // ─── Allocations ───────────────────────────────────────────────

    function test_AllocateFunds() public {
        vm.prank(finance);
        uint256 receiptId = chainLogger.recordReceipt("Donor", AMOUNT_100, BANK_REF, BANK_TX_HASH);

        vm.prank(finance);
        uint256 projectId = chainLogger.createProject("Project", "Desc", IPFS_CID);

        vm.prank(finance);
        uint256 allocationId = chainLogger.allocateFunds(receiptId, projectId, AMOUNT_50, "Test allocation");

        assertEq(allocationId, 0);
        assertEq(chainLogger.getTotalAllocations(), 1);

        ChainLogger.Allocation memory allocation = chainLogger.getAllocation(0);
        assertEq(allocation.receiptId, receiptId);
        assertEq(allocation.projectId, projectId);
        assertEq(allocation.amountUSD, AMOUNT_50);
        assertEq(allocation.purpose, "Test allocation");
        assertTrue(allocation.exists);

        ChainLogger.Project memory project = chainLogger.getProject(projectId);
        assertEq(project.totalAllocated, AMOUNT_50);
    }

    function test_AllocateMoreThanAvailableReverts() public {
        vm.prank(finance);
        uint256 receiptId = chainLogger.recordReceipt("Donor", AMOUNT_50, BANK_REF, BANK_TX_HASH);

        vm.prank(finance);
        uint256 projectId = chainLogger.createProject("Project", "Desc", IPFS_CID);

        vm.prank(finance);
        vm.expectRevert(ChainLogger.InsufficientFunds.selector);
        chainLogger.allocateFunds(receiptId, projectId, AMOUNT_100, "Too much");
    }

    function test_AllocateToNonExistentReceiptReverts() public {
        vm.prank(finance);
        uint256 projectId = chainLogger.createProject("Project", "Desc", IPFS_CID);

        vm.prank(finance);
        vm.expectRevert(ChainLogger.ReceiptDoesNotExist.selector);
        chainLogger.allocateFunds(999, projectId, AMOUNT_50, "Test");
    }

    function test_AllocateToNonExistentProjectReverts() public {
        vm.prank(finance);
        uint256 receiptId = chainLogger.recordReceipt("Donor", AMOUNT_100, BANK_REF, BANK_TX_HASH);

        vm.prank(finance);
        vm.expectRevert(ChainLogger.ProjectDoesNotExist.selector);
        chainLogger.allocateFunds(receiptId, 999, AMOUNT_50, "Test");
    }

    function test_ReceiptMarkedAllocatedWhenFullyUsed() public {
        vm.prank(finance);
        uint256 receiptId = chainLogger.recordReceipt("Donor", AMOUNT_50, BANK_REF, BANK_TX_HASH);

        vm.prank(finance);
        uint256 projectId = chainLogger.createProject("Project", "Desc", IPFS_CID);

        vm.prank(finance);
        chainLogger.allocateFunds(receiptId, projectId, AMOUNT_50, "Full allocation");

        ChainLogger.Receipt memory receipt = chainLogger.getReceipt(receiptId);
        assertEq(uint256(receipt.status), uint256(ChainLogger.ReceiptStatus.Allocated));
    }

    function test_MultiplePartialAllocationsFromSameReceipt() public {
        vm.prank(finance);
        uint256 receiptId = chainLogger.recordReceipt("Donor", AMOUNT_100, BANK_REF, BANK_TX_HASH);

        vm.prank(finance);
        uint256 projectId = chainLogger.createProject("Project", "Desc", IPFS_CID);

        vm.prank(finance);
        uint256 alloc1 = chainLogger.allocateFunds(receiptId, projectId, AMOUNT_30, "First");
        vm.prank(finance);
        uint256 alloc2 = chainLogger.allocateFunds(receiptId, projectId, AMOUNT_50, "Second");
        vm.prank(finance);
        uint256 alloc3 = chainLogger.allocateFunds(receiptId, projectId, AMOUNT_20, "Third");

        // All three allocations should succeed (30+50+20 = 100)
        assertEq(alloc1, 0);
        assertEq(alloc2, 1);
        assertEq(alloc3, 2);

        // Now total is fully allocated
        ChainLogger.Receipt memory receipt = chainLogger.getReceipt(receiptId);
        assertEq(uint256(receipt.status), uint256(ChainLogger.ReceiptStatus.Allocated));

        // Fourth allocation should fail
        vm.prank(finance);
        vm.expectRevert(ChainLogger.InsufficientFunds.selector);
        chainLogger.allocateFunds(receiptId, projectId, 1, "Over");
    }

    // ─── Invoices ──────────────────────────────────────────────────

    function test_VendorCanSubmitInvoice() public {
        vm.prank(finance);
        uint256 receiptId = chainLogger.recordReceipt("Donor", AMOUNT_100, BANK_REF, BANK_TX_HASH);

        vm.prank(finance);
        uint256 projectId = chainLogger.createProject("Project", "Desc", IPFS_CID);

        vm.prank(finance);
        uint256 allocationId = chainLogger.allocateFunds(receiptId, projectId, AMOUNT_50, "Allocation");

        vm.prank(vendor);
        uint256 invoiceId = chainLogger.submitInvoice(
            allocationId,
            "Vendor Inc",
            AMOUNT_30,
            INVOICE_HASH,
            IPFS_CID,
            "Invoice for work done"
        );

        assertEq(invoiceId, 0);
        assertEq(chainLogger.getTotalInvoices(), 1);

        ChainLogger.Invoice memory invoice = chainLogger.getInvoice(0);
        assertEq(invoice.vendorName, "Vendor Inc");
        assertEq(invoice.amountUSD, AMOUNT_30);
        assertEq(invoice.invoiceHash, INVOICE_HASH);
        assertEq(invoice.ipfsCid, IPFS_CID);
        assertEq(uint256(invoice.status), uint256(ChainLogger.InvoiceStatus.Submitted));
        assertTrue(invoice.exists);
    }

    function test_NonVendorCannotSubmitInvoice() public {
        vm.prank(finance);
        uint256 receiptId = chainLogger.recordReceipt("Donor", AMOUNT_100, BANK_REF, BANK_TX_HASH);

        vm.prank(finance);
        uint256 projectId = chainLogger.createProject("Project", "Desc", IPFS_CID);

        vm.prank(finance);
        uint256 allocationId = chainLogger.allocateFunds(receiptId, projectId, AMOUNT_50, "Allocation");

        vm.prank(viewer);
        vm.expectRevert();
        chainLogger.submitInvoice(allocationId, "Vendor", AMOUNT_30, INVOICE_HASH, IPFS_CID, "Desc");
    }

    function test_InvalidInvoiceHashLengthReverts() public {
        vm.prank(finance);
        uint256 receiptId = chainLogger.recordReceipt("Donor", AMOUNT_100, BANK_REF, BANK_TX_HASH);

        vm.prank(finance);
        uint256 projectId = chainLogger.createProject("Project", "Desc", IPFS_CID);

        vm.prank(finance);
        uint256 allocationId = chainLogger.allocateFunds(receiptId, projectId, AMOUNT_50, "Allocation");

        vm.prank(vendor);
        vm.expectRevert(ChainLogger.InvalidHashLength.selector);
        chainLogger.submitInvoice(allocationId, "Vendor", AMOUNT_30, "tooshort", IPFS_CID, "Desc");
    }

    // ─── Invoice Review ────────────────────────────────────────────

    function test_FinanceCanApproveInvoice() public {
        vm.prank(finance);
        uint256 receiptId = chainLogger.recordReceipt("Donor", AMOUNT_100, BANK_REF, BANK_TX_HASH);

        vm.prank(finance);
        uint256 projectId = chainLogger.createProject("Project", "Desc", IPFS_CID);

        vm.prank(finance);
        uint256 allocationId = chainLogger.allocateFunds(receiptId, projectId, AMOUNT_50, "Allocation");

        vm.prank(vendor);
        uint256 invoiceId = chainLogger.submitInvoice(allocationId, "Vendor", AMOUNT_30, INVOICE_HASH, IPFS_CID, "Desc");

        vm.prank(finance);
        chainLogger.approveInvoice(invoiceId);

        ChainLogger.Invoice memory invoice = chainLogger.getInvoice(invoiceId);
        assertEq(uint256(invoice.status), uint256(ChainLogger.InvoiceStatus.Approved));
    }

    function test_FinanceCanRejectInvoice() public {
        vm.prank(finance);
        uint256 receiptId = chainLogger.recordReceipt("Donor", AMOUNT_100, BANK_REF, BANK_TX_HASH);

        vm.prank(finance);
        uint256 projectId = chainLogger.createProject("Project", "Desc", IPFS_CID);

        vm.prank(finance);
        uint256 allocationId = chainLogger.allocateFunds(receiptId, projectId, AMOUNT_50, "Allocation");

        vm.prank(vendor);
        uint256 invoiceId = chainLogger.submitInvoice(allocationId, "Vendor", AMOUNT_30, INVOICE_HASH, IPFS_CID, "Desc");

        vm.prank(finance);
        chainLogger.rejectInvoice(invoiceId, "Invalid documentation");

        ChainLogger.Invoice memory invoice = chainLogger.getInvoice(invoiceId);
        assertEq(uint256(invoice.status), uint256(ChainLogger.InvoiceStatus.Rejected));
        assertEq(invoice.rejectionReason, "Invalid documentation");
    }

    // ─── Evidence ──────────────────────────────────────────────────

    function test_VendorCanUploadEvidence() public {
        vm.prank(finance);
        uint256 receiptId = chainLogger.recordReceipt("Donor", AMOUNT_100, BANK_REF, BANK_TX_HASH);

        vm.prank(finance);
        uint256 projectId = chainLogger.createProject("Project", "Desc", IPFS_CID);

        vm.prank(finance);
        uint256 allocationId = chainLogger.allocateFunds(receiptId, projectId, AMOUNT_50, "Allocation");

        vm.prank(vendor);
        uint256 invoiceId = chainLogger.submitInvoice(allocationId, "Vendor", AMOUNT_30, INVOICE_HASH, IPFS_CID, "Desc");

        vm.prank(vendor);
        uint256 evidenceId = chainLogger.uploadEvidence(
            invoiceId,
            INVOICE_HASH,
            IPFS_CID,
            "photo.jpg",
            "image/jpeg",
            1024
        );

        assertEq(evidenceId, 0);
        assertEq(chainLogger.getTotalEvidences(), 1);

        ChainLogger.Evidence memory evidence = chainLogger.getEvidence(0);
        assertEq(evidence.invoiceId, invoiceId);
        assertEq(evidence.evidenceHash, INVOICE_HASH);
        assertEq(evidence.ipfsCid, IPFS_CID);
        assertEq(evidence.fileName, "photo.jpg");
        assertEq(evidence.fileType, "image/jpeg");
        assertEq(evidence.fileSizeBytes, 1024);
        assertEq(uint256(evidence.status), uint256(ChainLogger.EvidenceStatus.Uploaded));
        assertTrue(evidence.exists);
    }

    function test_EvidenceWithInvalidHashLengthReverts() public {
        vm.prank(vendor);
        vm.expectRevert(ChainLogger.InvalidHashLength.selector);
        chainLogger.uploadEvidence(0, "short", IPFS_CID, "file.jpg", "image/jpeg", 1024);
    }

    function test_EvidenceWithZeroFileSizeReverts() public {
        vm.prank(vendor);
        vm.expectRevert(ChainLogger.InvalidFileSize.selector);
        chainLogger.uploadEvidence(0, INVOICE_HASH, IPFS_CID, "file.jpg", "image/jpeg", 0);
    }

    // ─── Evidence Verification ─────────────────────────────────────

    function test_FinanceCanVerifyEvidence() public {
        vm.prank(finance);
        uint256 receiptId = chainLogger.recordReceipt("Donor", AMOUNT_100, BANK_REF, BANK_TX_HASH);

        vm.prank(finance);
        uint256 projectId = chainLogger.createProject("Project", "Desc", IPFS_CID);

        vm.prank(finance);
        uint256 allocationId = chainLogger.allocateFunds(receiptId, projectId, AMOUNT_50, "Allocation");

        vm.prank(vendor);
        uint256 invoiceId = chainLogger.submitInvoice(allocationId, "Vendor", AMOUNT_30, INVOICE_HASH, IPFS_CID, "Desc");

        vm.prank(vendor);
        uint256 evidenceId = chainLogger.uploadEvidence(invoiceId, INVOICE_HASH, IPFS_CID, "file.jpg", "image/jpeg", 1024);

        vm.prank(finance);
        chainLogger.verifyEvidence(evidenceId, "Looks good");

        ChainLogger.Evidence memory evidence = chainLogger.getEvidence(evidenceId);
        assertEq(uint256(evidence.status), uint256(ChainLogger.EvidenceStatus.Verified));
        assertEq(evidence.verificationNote, "Looks good");
    }

    function test_FinanceCanRejectEvidence() public {
        vm.prank(finance);
        uint256 receiptId = chainLogger.recordReceipt("Donor", AMOUNT_100, BANK_REF, BANK_TX_HASH);

        vm.prank(finance);
        uint256 projectId = chainLogger.createProject("Project", "Desc", IPFS_CID);

        vm.prank(finance);
        uint256 allocationId = chainLogger.allocateFunds(receiptId, projectId, AMOUNT_50, "Allocation");

        vm.prank(vendor);
        uint256 invoiceId = chainLogger.submitInvoice(allocationId, "Vendor", AMOUNT_30, INVOICE_HASH, IPFS_CID, "Desc");

        vm.prank(vendor);
        uint256 evidenceId = chainLogger.uploadEvidence(invoiceId, INVOICE_HASH, IPFS_CID, "file.jpg", "image/jpeg", 1024);

        vm.prank(finance);
        chainLogger.rejectEvidence(evidenceId, "Blurry photo");

        ChainLogger.Evidence memory evidence = chainLogger.getEvidence(evidenceId);
        assertEq(uint256(evidence.status), uint256(ChainLogger.EvidenceStatus.Rejected));
        assertEq(evidence.verificationNote, "Blurry photo");
        assertEq(evidence.verifiedBy, finance);
        assertTrue(evidence.verifiedAt > 0);
    }

    // ─── Pausable ──────────────────────────────────────────────────

    function test_AdminCanPauseAndUnpause() public {
        vm.prank(admin);
        chainLogger.pause();

        vm.prank(finance);
        vm.expectRevert();
        chainLogger.recordReceipt("Donor", AMOUNT_100, BANK_REF, BANK_TX_HASH);

        vm.prank(admin);
        chainLogger.unpause();

        vm.prank(finance);
        uint256 receiptId = chainLogger.recordReceipt("Donor", AMOUNT_100, BANK_REF, BANK_TX_HASH);
        assertEq(receiptId, 0);
    }

    function test_NonAdminCannotPause() public {
        vm.prank(finance);
        vm.expectRevert();
        chainLogger.pause();
    }

    // ─── Project Lifecycle ─────────────────────────────────────────

    function test_FinanceCanCancelProject() public {
        vm.prank(finance);
        uint256 projectId = chainLogger.createProject("Project", "Desc", IPFS_CID);

        vm.prank(finance);
        vm.expectEmit(true, false, true, false);
        emit ChainLogger.ProjectStatusUpdated(projectId, ChainLogger.ProjectStatus.Cancelled, finance);
        chainLogger.cancelProject(projectId);

        ChainLogger.Project memory project = chainLogger.getProject(projectId);
        assertEq(uint256(project.status), uint256(ChainLogger.ProjectStatus.Cancelled));
    }

    function test_FinanceCanCompleteProject() public {
        vm.prank(finance);
        uint256 projectId = chainLogger.createProject("Project", "Desc", IPFS_CID);

        vm.prank(finance);
        vm.expectEmit(true, false, true, false);
        emit ChainLogger.ProjectStatusUpdated(projectId, ChainLogger.ProjectStatus.Completed, finance);
        chainLogger.completeProject(projectId);

        ChainLogger.Project memory project = chainLogger.getProject(projectId);
        assertEq(uint256(project.status), uint256(ChainLogger.ProjectStatus.Completed));
    }

    function test_CannotAllocateToCancelledProject() public {
        vm.prank(finance);
        uint256 receiptId = chainLogger.recordReceipt("Donor", AMOUNT_100, BANK_REF, BANK_TX_HASH);

        vm.prank(finance);
        uint256 projectId = chainLogger.createProject("Project", "Desc", IPFS_CID);

        vm.prank(finance);
        chainLogger.cancelProject(projectId);

        vm.prank(finance);
        vm.expectRevert(ChainLogger.ProjectNotActive.selector);
        chainLogger.allocateFunds(receiptId, projectId, AMOUNT_50, "Test");
    }

    // ─── Helpers ───────────────────────────────────────────────────

    function test_GetProjectAllocations() public {
        vm.prank(finance);
        uint256 receiptId = chainLogger.recordReceipt("Donor", AMOUNT_100, BANK_REF, BANK_TX_HASH);

        vm.prank(finance);
        uint256 projectId = chainLogger.createProject("Project", "Desc", IPFS_CID);

        vm.prank(finance);
        chainLogger.allocateFunds(receiptId, projectId, AMOUNT_50, "Alloc 1");

        vm.prank(finance);
        uint256 receiptId2 = chainLogger.recordReceipt("Donor2", AMOUNT_100, BANK_REF, BANK_TX_HASH);

        vm.prank(finance);
        chainLogger.allocateFunds(receiptId2, projectId, AMOUNT_30, "Alloc 2");

        uint256[] memory allocs = chainLogger.getProjectAllocations(projectId);
        assertEq(allocs.length, 2);
    }

    function test_GetReceiptAllocations() public {
        vm.prank(finance);
        uint256 receiptId = chainLogger.recordReceipt("Donor", AMOUNT_100, BANK_REF, BANK_TX_HASH);

        vm.prank(finance);
        uint256 projectId = chainLogger.createProject("Project", "Desc", IPFS_CID);

        vm.prank(finance);
        chainLogger.allocateFunds(receiptId, projectId, AMOUNT_50, "Alloc 1");

        vm.prank(finance);
        chainLogger.allocateFunds(receiptId, projectId, AMOUNT_30, "Alloc 2");

        uint256[] memory allocs = chainLogger.getReceiptAllocations(receiptId);
        assertEq(allocs.length, 2);
    }

    function test_GetNonExistentReceiptReverts() public {
        vm.expectRevert(ChainLogger.ReceiptDoesNotExist.selector);
        chainLogger.getReceipt(999);
    }

    function test_GetNonExistentProjectReverts() public {
        vm.expectRevert(ChainLogger.ProjectDoesNotExist.selector);
        chainLogger.getProject(999);
    }

    function test_GetProjectInvoices() public {
        vm.prank(finance);
        uint256 receiptId = chainLogger.recordReceipt("Donor", AMOUNT_100, BANK_REF, BANK_TX_HASH);

        vm.prank(finance);
        uint256 projectId = chainLogger.createProject("Project", "Desc", IPFS_CID);

        vm.prank(finance);
        uint256 allocId1 = chainLogger.allocateFunds(receiptId, projectId, AMOUNT_50, "Alloc 1");

        vm.prank(vendor);
        uint256 invoiceId = chainLogger.submitInvoice(allocId1, "Vendor", AMOUNT_30, INVOICE_HASH, IPFS_CID, "Desc");

        uint256[] memory projectInvoices = chainLogger.getProjectInvoices(projectId);
        assertEq(projectInvoices.length, 1);
        assertEq(projectInvoices[0], invoiceId);
    }

    function test_CountersReturnCorrectTotals() public {
        vm.prank(finance);
        chainLogger.recordReceipt("D1", AMOUNT_100, BANK_REF, BANK_TX_HASH);
        vm.prank(finance);
        chainLogger.recordReceipt("D2", AMOUNT_50, BANK_REF, BANK_TX_HASH);

        vm.prank(finance);
        uint256 projectId = chainLogger.createProject("P", "D", IPFS_CID);

        vm.prank(finance);
        chainLogger.allocateFunds(0, projectId, AMOUNT_30, "A1");
        vm.prank(finance);
        chainLogger.allocateFunds(1, projectId, AMOUNT_20, "A2");

        assertEq(chainLogger.getTotalReceipts(), 2);
        assertEq(chainLogger.getTotalProjects(), 1);
        assertEq(chainLogger.getTotalAllocations(), 2);
    }

    function test_MarkInvoicePaid() public {
        vm.prank(finance);
        uint256 receiptId = chainLogger.recordReceipt("Donor", AMOUNT_100, BANK_REF, BANK_TX_HASH);

        vm.prank(finance);
        uint256 projectId = chainLogger.createProject("Project", "Desc", IPFS_CID);

        vm.prank(finance);
        uint256 allocationId = chainLogger.allocateFunds(receiptId, projectId, AMOUNT_50, "Allocation");

        vm.prank(vendor);
        uint256 invoiceId = chainLogger.submitInvoice(allocationId, "Vendor", AMOUNT_30, INVOICE_HASH, IPFS_CID, "Desc");

        vm.prank(finance);
        chainLogger.approveInvoice(invoiceId);

        vm.prank(finance);
        chainLogger.markInvoicePaid(invoiceId);

        ChainLogger.Invoice memory invoice = chainLogger.getInvoice(invoiceId);
        assertEq(uint256(invoice.status), uint256(ChainLogger.InvoiceStatus.Paid));
    }

    // ─── Fuzz Tests ─────────────────────────────────────────────────

    function test_Fuzz_RecordReceipt(uint256 _amount, string calldata _name) public {
        // Bound amount to reasonable range (1 cent to $1M)
        uint256 amount = bound(_amount, 1, 100_000_000);
        bool hasName = bytes(_name).length > 0;
        string memory name = hasName ? string(_name) : "Anonymous";

        vm.prank(finance);
        uint256 receiptId = chainLogger.recordReceipt(name, amount, BANK_REF, BANK_TX_HASH);

        ChainLogger.Receipt memory receipt = chainLogger.getReceipt(receiptId);
        assertEq(receipt.amountUSD, amount);
        assertEq(uint256(receipt.status), uint256(ChainLogger.ReceiptStatus.Recorded));
        assertTrue(receipt.exists);
    }

    function test_Fuzz_AllocateFunds(uint256 _allocAmount) public {
        vm.prank(finance);
        uint256 receiptId = chainLogger.recordReceipt("Donor", AMOUNT_100, BANK_REF, BANK_TX_HASH);

        vm.prank(finance);
        uint256 projectId = chainLogger.createProject("Project", "Desc", IPFS_CID);

        uint256 allocAmount = bound(_allocAmount, 1, AMOUNT_100);

        vm.prank(finance);
        uint256 allocationId = chainLogger.allocateFunds(receiptId, projectId, allocAmount, "Purpose");

        ChainLogger.Allocation memory alloc = chainLogger.getAllocation(allocationId);
        assertEq(alloc.amountUSD, allocAmount);
        assertTrue(alloc.exists);
    }

    function test_Fuzz_ReceiptAmountAfterPartialAllocations(uint256 _firstAlloc, uint256 _secondAlloc) public {
        vm.prank(finance);
        uint256 receiptId = chainLogger.recordReceipt("Donor", AMOUNT_100, BANK_REF, BANK_TX_HASH);

        vm.prank(finance);
        uint256 projectId = chainLogger.createProject("Project", "Desc", IPFS_CID);

        uint256 first = bound(_firstAlloc, 1, AMOUNT_100);
        uint256 second = bound(_secondAlloc, 1, AMOUNT_100);

        // Only allocate if total doesn't exceed receipt amount
        if (first + second <= AMOUNT_100) {
            vm.prank(finance);
            chainLogger.allocateFunds(receiptId, projectId, first, "First");

            vm.prank(finance);
            chainLogger.allocateFunds(receiptId, projectId, second, "Second");

            uint256 expectedTotal = first + second;

            ChainLogger.Receipt memory receipt = chainLogger.getReceipt(receiptId);
            assertEq(receipt.amountUSD - (first + second), AMOUNT_100 - expectedTotal);
            if (expectedTotal >= AMOUNT_100) {
                assertEq(uint256(receipt.status), uint256(ChainLogger.ReceiptStatus.Allocated));
            }
        }
    }

    // ─── Invariant Test: Index Consistency ──────────────────────────

    function test_InvoiceIndicesConsistent() public {
        // Setup: create a receipt, project, allocation, and invoice
        vm.prank(finance);
        uint256 receiptId = chainLogger.recordReceipt("Donor", AMOUNT_100, BANK_REF, BANK_TX_HASH);

        vm.prank(finance);
        uint256 projectId = chainLogger.createProject("Project", "Desc", IPFS_CID);

        vm.prank(finance);
        uint256 allocationId = chainLogger.allocateFunds(receiptId, projectId, AMOUNT_50, "Allocation");

        vm.prank(vendor);
        chainLogger.submitInvoice(allocationId, "Vendor", AMOUNT_30, INVOICE_HASH, IPFS_CID, "Desc");

        // Verify indices are consistent
        uint256 totalInvoices = chainLogger.getTotalInvoices();
        for (uint256 i = 0; i < totalInvoices; i++) {
            ChainLogger.Invoice memory inv = chainLogger.getInvoice(i);
            if (!inv.exists) continue;

            // Verify project index contains this invoice
            ChainLogger.Allocation memory alloc = chainLogger.getAllocation(inv.allocationId);
            uint256[] memory projInvoices = chainLogger.getProjectInvoices(alloc.projectId);
            bool foundInProject = false;
            for (uint256 j = 0; j < projInvoices.length; j++) {
                if (projInvoices[j] == i) { foundInProject = true; break; }
            }
            assertTrue(foundInProject, "Invoice missing from project index");

            // Verify vendor index contains this invoice
            uint256[] memory vendorInvoices = chainLogger.getVendorInvoices(inv.vendor);
            bool foundInVendor = false;
            for (uint256 j = 0; j < vendorInvoices.length; j++) {
                if (vendorInvoices[j] == i) { foundInVendor = true; break; }
            }
            assertTrue(foundInVendor, "Invoice missing from vendor index");
        }
    }
}
