// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {DoctorRegistry} from "../../contracts/DoctorRegistry/DoctorRegistry.sol";
import {Structs} from "../../contracts/Structs.sol";
import {Test} from "forge-std/Test.sol";

contract CounterTest is Test {
    DoctorRegistry DocReg;

    address alice = makeAddr("alice");
    address admin = makeAddr("admin");
    address approver = makeAddr("approver");

    function setUp() public {
        DocReg = new DoctorRegistry(admin, 1e6);

        vm.startPrank(admin);
        DocReg.grantRole(keccak256("APPROVER"), approver);
    }

    function test_DoctorRegisters() public {
        Structs.RegStruct memory Reg = Structs.RegStruct("Plairfx", "Mental-Health-Therapy", alice, 1e6);
        DocReg.registerAsDoctor(Reg);

        assertEq(keccak256(abi.encode(Reg)), keccak256(abi.encode(DocReg.getPendingDoctor(1))));
    }

    function test_ApproveDoctor() public {
        vm.startPrank(alice);

        Structs.RegStruct memory Reg = Structs.RegStruct("Plairfx", "Mental-Health-Therapy", alice, 1e6);
        DocReg.registerAsDoctor(Reg);

        vm.expectRevert();
        DocReg.approveDoctor(1);
    }

    function test_ApproverCanApprovePendingRequest() public {
        vm.startPrank(alice);

        DoctorRegistry.RegStruct memory Reg = DoctorRegistry.RegStruct("Plairfx", "Mental-Health-Therapy", alice, 1e6);
        DocReg.registerAsDoctor(Reg);

        vm.startPrank(approver);

        DocReg.approveDoctor(1);

        assertEq(keccak256(abi.encode(Reg)), keccak256(abi.encode(DocReg.getDoctor(1))));
    }

    function test_ApproverCanDenyPendingRequest() public {
        vm.startPrank(alice);

        DoctorRegistry.RegStruct memory Reg = DoctorRegistry.RegStruct("Plairfx", "Mental-Health-Therapy", alice, 1e6);
        DocReg.registerAsDoctor(Reg);

        vm.expectRevert();
        DocReg.denyDoctor(1);

        vm.startPrank(approver);

        DocReg.denyDoctor(1);

        assertNotEq(keccak256(abi.encode(Reg)), keccak256(abi.encode(DocReg.getDoctor(1))));
    }

    function test_AdminCanChangeDepositFee() public {
        vm.startPrank(alice);
        vm.expectRevert();

        DocReg.changeDepositFee(1e6);

        vm.startPrank(admin);

        DocReg.changeDepositFee(5e6);

        assertEq(5e6, DocReg.depositFee());
    }
}
