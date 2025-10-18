// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {DoctorRegistry} from "../contracts/DoctorRegistry.sol";
import {Test} from "forge-std/Test.sol";

contract CounterTest is Test {
    DoctorRegistry DocReg;

    address alice = makeAddr("alice");

    address owner = makeAddr("Owner");

    function setUp() public {
        vm.startPrank(owner);
        DocReg = new DoctorRegistry();
    }

    function test_DoctorRegisters() public {
        DoctorRegistry.RegStruct memory Reg = DoctorRegistry.RegStruct("Plairfx", "Mental-Health-Therapy", alice, 1e6);
        DocReg.registerAsDoctor(Reg);

        assertEq(keccak256(abi.encode(Reg)), keccak256(abi.encode(DocReg.getPendingDoctor(1))));
    }

    function test_ApproveDoctor() public {
        vm.startPrank(alice);

        DoctorRegistry.RegStruct memory Reg = DoctorRegistry.RegStruct("Plairfx", "Mental-Health-Therapy", alice, 1e6);
        DocReg.registerAsDoctor(Reg);

        vm.expectRevert();
        DocReg.approveDoctor(1);
    }
}
