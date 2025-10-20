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
        uint256 currentDepositFee = DocReg.depositFee();
        Structs.RegStruct memory Reg =
            Structs.RegStruct("Plairfx", "Mental-Health-Therapy", alice, consultationFeePerHour, 0, 0);
        vm.startPrank(alice);
        PYUSD.approve(address(DocReg), stakeAmount + depositFee);
        DocReg.registerAsDoctor(Reg);
        _;
    }

    function test_DoctorRegisters() public {
        uint256 currentStakeAmount = DocReg.stakeAmount();

        uint256 balanceBefore = PYUSD.balanceOf(alice);
        Structs.RegStruct memory Reg =
            Structs.RegStruct("Plairfx", "Mental-Health-Therapy", address(0x0), consultationFeePerHour, 0, 0);

        vm.startPrank(alice);
        PYUSD.approve(address(DocReg), currentStakeAmount + depositFee);
        vm.expectRevert("Wallet cannot be a zero address!");
        DocReg.registerAsDoctor(Reg);

        Reg.paymentWallet = address(alice);
        DocReg.registerAsDoctor(Reg);

        Structs.RegStruct memory ExpectedReturn = Structs.RegStruct(
            "Plairfx", "Mental-Health-Therapy", alice, consultationFeePerHour, stakeAmount, depositFee
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

        Structs.RegStruct memory Reg =
            Structs.RegStruct("Plairfx", "Mental-Health-Therapy", alice, consultationFeePerHour, 0, 0);
        PYUSD.approve(address(DocReg), currentStakeAmount);
        DocReg.registerAsDoctor(Reg);

        vm.startPrank(approver);
        vm.expectEmit(true, true, true, true);
        emit DoctorRegistry.DoctorApproved(1);

        DocReg.approveDoctor(1);

        Structs.RegStruct memory ExpectedReturn = Structs.RegStruct(
            "Plairfx", "Mental-Health-Therapy", alice, consultationFeePerHour, stakeAmount, depositFee
        );

        assertEq(keccak256(abi.encode(ExpectedReturn)), keccak256(abi.encode(DocReg.getDoctor(1))));
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
            "Plairfx", "Mental-Health-Therapy", alice, consultationFeePerHour, stakeAmount, depositFee
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
        vm.startPrank(admin);
        DocReg.withdrawDepositFees();

        assertEq(balanceBefore + stakeAmount, PYUSD.balanceOf(admin));
    }
}
