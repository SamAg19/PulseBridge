// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ConsultationEscrow} from "../../contracts/ConsultationEscrow/ConsultationEscrow.sol";
import {DoctorRegistry} from "../../contracts/DoctorRegistry/DoctorRegistry.sol";
import {Structs} from "../../contracts/Structs.sol";
import {Test} from "forge-std/Test.sol";
import {MockERC20} from "../../contracts/Mocks/MockERC20.sol";
import {MockPyth} from "../../contracts/Mocks/MockPyth.sol";

contract ConsultationEscrowTest is Test {
    DoctorRegistry DocReg;
    ConsultationEscrow ConsultEscrow;
    MockERC20 PYUSD;
    MockERC20 USDC;
    MockERC20 USDT;
    MockPyth Pyth;

    address admin = makeAddr("admin");
    address doctor = makeAddr("doctor");
    address alice = makeAddr("alice");

    function setUp() public {
        PYUSD = new MockERC20("PayPal USD", "pyUSD");
        USDC = new MockERC20("USD Coin", "USDC");
        USDT = new MockERC20("Tether USD", "USDT");
        Pyth = new MockPyth();
        DocReg = new DoctorRegistry(admin, 10e6, address(PYUSD));
        ConsultEscrow = new ConsultationEscrow(address(DocReg), address(Pyth), address(PYUSD), address(USDC), address(USDT));
    }

    function test_createSession() public {}
}
