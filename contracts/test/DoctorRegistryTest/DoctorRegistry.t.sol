// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {DoctorRegistry} from "../../contracts/DoctorRegistry/DoctorRegistry.sol";
import {Structs} from "../../contracts/Structs.sol";
import {Test} from "forge-std/Test.sol";
import {MockERC20} from "../../contracts/Mocks/MockERC20.sol";

contract DoctorRegistryTest is Test {
    DoctorRegistry DocReg;
    MockERC20 PYUSD;

    address alice = makeAddr("alice");
    address admin = makeAddr("admin");
    address approver = makeAddr("approver");

    uint256 consultationFeePerHour = 50e6;
    uint256 stakeAmount = 5e6;
    uint256 depositFee = 1e6;

    string validDocIPFSHash = "validDocumentsHash";
    string invalidDocIPFSHash = " ";

    string profileDescription =
        "Experienced mental health therapist specializing in cognitive behavioral therapy and mindfulness techniques.";
    string email = "alice@example.com";

    function setUp() public {
        vm.startPrank(admin);
        PYUSD = new MockERC20("PayPal USD", "pyUSD");
        DocReg = new DoctorRegistry(admin, depositFee, stakeAmount, address(PYUSD));

        // minting tokens..
        PYUSD.mint(alice, 55e6);

        vm.startPrank(admin);
        DocReg.grantRole(keccak256("APPROVER"), approver);
    }

    modifier registration() {
        vm.startPrank(alice);
        PYUSD.approve(address(DocReg), stakeAmount);
        DocReg.registerAsDoctor(
            "Alice", "Mental-Health-Therapy", profileDescription, email, consultationFeePerHour, invalidDocIPFSHash
        );
        _;
    }

    function test_DoctorRegisters() public {
        uint256 currentStakeAmount = DocReg.stakeAmount();

        uint256 balanceBefore = PYUSD.balanceOf(alice);

        vm.startPrank(alice);
        PYUSD.approve(address(DocReg), currentStakeAmount);
        vm.expectRevert("Legal documents IPFS hash is required!");
        DocReg.registerAsDoctor(
            "Alice", "Mental-Health-Therapy", profileDescription, email, consultationFeePerHour, ""
        );

        DocReg.registerAsDoctor(
            "Alice", "Mental-Health-Therapy", profileDescription, email, consultationFeePerHour, validDocIPFSHash
        );

        Structs.RegStruct memory ExpectedReturn = Structs.RegStruct(
            "Alice",
            "Mental-Health-Therapy",
            profileDescription,
            email,
            alice,
            consultationFeePerHour,
            depositFee,
            validDocIPFSHash
        );

        assertEq(keccak256(abi.encode(ExpectedReturn)), keccak256(abi.encode(DocReg.getPendingDoctor(1))));
        uint256 balanceAfter = PYUSD.balanceOf(alice);

        assertEq(balanceBefore - currentStakeAmount, balanceAfter);
        assertEq(PYUSD.balanceOf(address(DocReg)), currentStakeAmount);
    }

    function test_ApproverCanApprovePendingRequest() public {
        uint256 currentStakeAmount = DocReg.stakeAmount();
        uint256 balanceBefore = PYUSD.balanceOf(alice);

        vm.startPrank(alice);
        vm.expectRevert();
        DocReg.approveDoctor(1);

        PYUSD.approve(address(DocReg), currentStakeAmount);
        DocReg.registerAsDoctor(
            "Alice", "Mental-Health-Therapy", profileDescription, email, consultationFeePerHour, validDocIPFSHash
        );

        vm.startPrank(approver);
        vm.expectEmit(true, true, true, true);
        emit DoctorRegistry.DoctorApproved(1);

        DocReg.approveDoctor(1);

        Structs.RegStruct memory ExpectedReturn = Structs.RegStruct(
            "Alice",
            "Mental-Health-Therapy",
            profileDescription,
            email,
            alice,
            consultationFeePerHour,
            depositFee,
            validDocIPFSHash
        );

        assertEq(keccak256(abi.encode(ExpectedReturn)), keccak256(abi.encode(DocReg.getDoctor(1))));
        assertEq(DocReg.getDoctorID(alice), 1);
        uint256 balanceAfter = PYUSD.balanceOf(alice);

        assertEq(balanceBefore - DocReg.depositFee(), balanceAfter);
        assertEq(PYUSD.balanceOf(address(DocReg)), DocReg.depositFee());
    }

    function test_ApproverCanDenyPendingRequest() public registration {
        vm.startPrank(alice);
        uint256 balanceBefore = PYUSD.balanceOf(alice);

        vm.expectRevert();
        DocReg.denyDoctor(1);

        vm.startPrank(approver);
        vm.expectEmit(true, true, true, true);
        emit DoctorRegistry.DoctorDenied(1);

        DocReg.denyDoctor(1);

        Structs.RegStruct memory ExpectedReturn = Structs.RegStruct(
            "Alice",
            "Mental-Health-Therapy",
            profileDescription,
            email,
            alice,
            consultationFeePerHour,
            depositFee,
            invalidDocIPFSHash
        );

        uint256 balanceAfter = PYUSD.balanceOf(alice);

        assertNotEq(keccak256(abi.encode(ExpectedReturn)), keccak256(abi.encode(DocReg.getDoctor(1))));
        assertEq(balanceBefore, balanceAfter);
        assertEq(PYUSD.balanceOf(address(DocReg)), stakeAmount);
    }

    function test_AdminCanChangeDepositFee() public {
        vm.startPrank(alice);
        vm.expectRevert();

        DocReg.changeDepositFee(1e6);

        vm.startPrank(admin);

        vm.expectEmit(true, true, true, true);
        emit DoctorRegistry.DepositFeeChanged(depositFee, 1e6);

        DocReg.changeDepositFee(1e6);

        assertEq(1e6, DocReg.depositFee());
    }

    function test_adminCanWithdrawDepositFees() public registration {
        vm.startPrank(alice);
        vm.expectRevert();
        DocReg.withdrawDepositFees();

        uint256 balanceBefore = PYUSD.balanceOf(admin);
        uint256 totalPYUsdToBeCollected = DocReg.totalPYUsdToBeCollected();
        vm.startPrank(admin);
        DocReg.withdrawDepositFees();

        assertEq(balanceBefore + totalPYUsdToBeCollected, PYUSD.balanceOf(admin));
        assertEq(0, DocReg.totalPYUsdToBeCollected());
    }
}
