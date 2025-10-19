// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {DoctorRegistry} from "../../contracts/DoctorRegistry/DoctorRegistry.sol";
import {Structs} from "../../contracts/Structs.sol";
import {Test} from "forge-std/Test.sol";
import {MockPyUSD} from "../../contracts/Mocks/MockPyUSD.sol";

contract CounterTest is Test {
    DoctorRegistry DocReg;
    MockPyUSD PYUSD;

    address alice = makeAddr("alice");
    address admin = makeAddr("admin");
    address approver = makeAddr("approver");

    uint256 consultationFeePerHour = 50e6;

    function setUp() public {
        vm.startPrank(admin);
        PYUSD = new MockPyUSD();
        DocReg = new DoctorRegistry(admin, 5e6, address(PYUSD));

        // minting tokens..
        PYUSD.mint(alice, 55e6);

        vm.startPrank(admin);
        DocReg.grantRole(keccak256("APPROVER"), approver);
    }

    modifier registration() {
        uint256 currentDepositFee = DocReg.depositFee();
        Structs.RegStruct memory Reg =
            Structs.RegStruct("Plairfx", "Mental-Health-Therapy", alice, consultationFeePerHour);
        vm.startPrank(alice);
        PYUSD.approve(address(DocReg), currentDepositFee);
        DocReg.registerAsDoctor(Reg);
        _;
    }

    function test_DoctorRegisters() public {
        uint256 currentDepositFee = DocReg.depositFee();
        uint256 balanceBefore = PYUSD.balanceOf(alice);
        Structs.RegStruct memory Reg =
            Structs.RegStruct("Plairfx", "Mental-Health-Therapy", alice, consultationFeePerHour);
        vm.startPrank(alice);
        PYUSD.approve(address(DocReg), currentDepositFee);
        DocReg.registerAsDoctor(Reg);

        assertEq(keccak256(abi.encode(Reg)), keccak256(abi.encode(DocReg.getPendingDoctor(1))));
        uint256 balanceAfter = PYUSD.balanceOf(alice);

        assertEq(balanceBefore - currentDepositFee, balanceAfter);
    }

    function test_ApproverCanApprovePendingRequest() public registration {
        vm.startPrank(alice);

        vm.expectRevert();
        DocReg.approveDoctor(1);
<<<<<<< HEAD
    }

    function test_ApproverCanApprovePendingRequest() public {
        vm.startPrank(alice);

        Structs.RegStruct memory Reg = Structs.RegStruct("Plairfx", "Mental-Health-Therapy", alice, 1e6);
        DocReg.registerAsDoctor(Reg);
=======
>>>>>>> e8ca4a7b6e1f4f9372a9213269756f3a755917f0

        Structs.RegStruct memory Reg =
            Structs.RegStruct("Plairfx", "Mental-Health-Therapy", alice, consultationFeePerHour);
        vm.startPrank(approver);
        vm.expectEmit(true, true, true, true);
        emit DoctorRegistry.DoctorApproved(1);

        DocReg.approveDoctor(1);

        assertEq(keccak256(abi.encode(Reg)), keccak256(abi.encode(DocReg.getDoctor(1))));
    }

    function test_ApproverCanDenyPendingRequest() public registration {
        Structs.RegStruct memory Reg =
            Structs.RegStruct("Plairfx", "Mental-Health-Therapy", alice, consultationFeePerHour);
        vm.startPrank(alice);

        vm.expectRevert();
        DocReg.denyDoctor(1);

        vm.startPrank(approver);
        vm.expectEmit(true, true, true, true);
        emit DoctorRegistry.DoctorDenied(1);

        DocReg.denyDoctor(1);

        assertNotEq(keccak256(abi.encode(Reg)), keccak256(abi.encode(DocReg.getDoctor(1))));
    }

    function test_AdminCanChangeDepositFee() public {
        vm.startPrank(alice);
        vm.expectRevert();

        DocReg.changeDepositFee(1e6);

        vm.startPrank(admin);

        vm.expectEmit(true, true, true, true);
        emit DoctorRegistry.DepositFeeChanged(5e6);

        DocReg.changeDepositFee(5e6);

        assertEq(5e6, DocReg.depositFee());
    }

    function test_adminCanWithdrawDepositFees() public registration {
        vm.startPrank(alice);
        vm.expectRevert();
        DocReg.withdrawDepositFees();

        uint256 currentDepositFee = DocReg.depositFee();
        uint256 balanceBefore = PYUSD.balanceOf(admin);
        vm.startPrank(admin);
        DocReg.withdrawDepositFees();

        assertEq(balanceBefore + currentDepositFee, PYUSD.balanceOf(admin));
    }
}
