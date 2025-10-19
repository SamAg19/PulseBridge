// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ConsultationEscrow} from "../../contracts/ConsultationEscrow/ConsultationEscrow.sol";
import {DoctorRegistry} from "../../contracts/DoctorRegistry/DoctorRegistry.sol";
import {Structs} from "../../contracts/Structs.sol";
import {Test} from "forge-std/Test.sol";
import {MockPyUSD} from "../../contracts/Mocks/MockPyUSD.sol";
import {MockPyth} from "../../contracts/Mocks/MockPyth.sol";

contract ConsultationEscrowTest is Test {
    DoctorRegistry DocReg;
    ConsultationEscrow ConsultEscrow;
    MockPyUSD PYUSD;
    MockPyth Pyth;

    address admin = makeAddr("admin");
    address doctor = makeAddr("doctor");
    address alice = makeAddr("alice");

    uint256 consultationFeePerHour = 50e6;
    uint256 depositFee = 10e6;

    function setUp() public {
        vm.startPrank(admin);
        PYUSD = new MockPyUSD();
        Pyth = new MockPyth();
        DocReg = new DoctorRegistry(admin, depositFee, address(PYUSD));
        ConsultEscrow = new ConsultationEscrow(address(DocReg), address(Pyth), address(PYUSD));

        vm.stopPrank();
    }

    modifier doctorCreatedAndApproved() {
        vm.startPrank(alice);
        PYUSD.faucet(10e6);

        Structs.RegStruct memory Reg =
            Structs.RegStruct("Alice", "Mental-Health-Therapy", alice, consultationFeePerHour, 0);

        PYUSD.approve(address(DocReg), depositFee);
        DocReg.registerAsDoctor(Reg);

        vm.startPrank(admin);
        DocReg.grantRole(keccak256("APPROVER"), admin);
        DocReg.approveDoctor(1);
        _;
    }

    function test_createSession() public doctorCreatedAndApproved {
        // needs data..
        bytes[] memory barray = new bytes[](1);
        vm.startPrank(alice);

        vm.expectRevert("Doctor not found");
        ConsultEscrow.createSession(2, consultationFeePerHour, barray);

        vm.expectRevert("Insufficient contract ETH for oracle fee");
        ConsultEscrow.createSession(1, consultationFeePerHour, barray);

        vm.deal(address(ConsultEscrow), 1 ether);

        //@info: getEthToUsd func does not exist,(reverts atm).

        // vm.expectRevert("Insufficient USD value from ETH");
        // ConsultEscrow.createSession(1, consultationFeePerHour, barray);
    }
}
