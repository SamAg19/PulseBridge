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

    function setUp() public {
        PYUSD = new MockPyUSD();
        Pyth = new MockPyth();
        DocReg = new DoctorRegistry(admin, 10e6, address(PYUSD));
        ConsultEscrow = new ConsultationEscrow(address(DocReg), address(Pyth), address(PYUSD));
    }

    function test_createSession() public {}
}
