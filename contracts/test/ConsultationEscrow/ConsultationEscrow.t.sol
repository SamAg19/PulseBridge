// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ConsultationEscrow} from "../../contracts/ConsultationEscrow/ConsultationEscrow.sol";
import {DoctorRegistry} from "../../contracts/DoctorRegistry/DoctorRegistry.sol";
import {Structs} from "../../contracts/Structs.sol";
import {Test, console} from "forge-std/Test.sol";
import {MockERC20} from "../../contracts/Mocks/MockERC20.sol";
import {MockPyth} from "../../contracts/Mocks/MockPyth.sol";
import {PythPriceConsumer} from "../../contracts/Oracle/PythPriceConsumer.sol";

contract ConsultationEscrowTest is Test {
    DoctorRegistry DocReg;
    ConsultationEscrow ConsultEscrow;
    MockERC20 PYUSD;
    MockERC20 USDC;
    MockERC20 USDT;
    MockPyth Pyth;
    PythPriceConsumer PythConsumer;

    address admin = makeAddr("admin");
    address doctor = makeAddr("doctor");
    address alice = makeAddr("alice");

    uint256 consultationFeePerHour = 50e6;
    uint256 depositFee = 1e6;
    uint256 stakeAmount = 5e6;

    function setUp() public {
        vm.startPrank(admin);
        PYUSD = new MockERC20("PayPal USD", "pyUSD");
        USDC = new MockERC20("USD Coin", "USDC");
        USDT = new MockERC20("Tether USD", "USDT");

        USDT.mint(alice, 50e6);
        USDC.mint(alice, 50e6);

        vm.deal(alice, 50 ether);

        PYUSD.mint(admin, 100e6);

        Pyth = new MockPyth();
        PythConsumer = new PythPriceConsumer(address(Pyth));

        DocReg = new DoctorRegistry(admin, depositFee, stakeAmount, address(PYUSD));
        ConsultEscrow =
            new ConsultationEscrow(address(DocReg), address(PythConsumer), address(PYUSD), address(USDC), address(USDT));

        vm.stopPrank();
    }

    modifier doctorCreatedAndApproved() {
        vm.startPrank(doctor);
        PYUSD.faucet(10e6);

        Structs.RegStruct memory Reg =
            Structs.RegStruct("Alice", "Mental-Health-Therapy", doctor, consultationFeePerHour, 0, 0);

        PYUSD.approve(address(DocReg), stakeAmount);
        DocReg.registerAsDoctor(Reg);

        vm.startPrank(admin);
        DocReg.grantRole(keccak256("APPROVER"), admin);
        DocReg.approveDoctor(1);
        _;
    }

    modifier sessionsCreated() {
        // Create Doctor and Approve him.
        vm.startPrank(doctor);
        PYUSD.faucet(10e6);

        Structs.RegStruct memory Reg =
            Structs.RegStruct("Alice", "Mental-Health-Therapy", doctor, consultationFeePerHour, 0, 0);

        PYUSD.approve(address(DocReg), stakeAmount);
        DocReg.registerAsDoctor(Reg);

        vm.startPrank(admin);
        DocReg.grantRole(keccak256("APPROVER"), admin);
        DocReg.approveDoctor(1);

        /// Create Sessions

        vm.deal(address(ConsultEscrow), 1 ether);

        bytes[] memory barray = new bytes[](1);
        uint256 updateFee = Pyth.getUpdateFee(barray);
        uint256 ConsultEscrowBalanceBefore = address(ConsultEscrow).balance;
        uint256 aliceBalanceBefore = alice.balance;

        vm.startPrank(admin);
        PYUSD.approve(address(ConsultEscrow), consultationFeePerHour);
        ConsultEscrow.depositPyusdReserve(50e6);

        // USDT
        vm.startPrank(alice);
        PYUSD.faucet(consultationFeePerHour);
        PYUSD.approve(address(ConsultEscrow), consultationFeePerHour);
        ConsultEscrow.createSession(1, consultationFeePerHour, barray, address(PYUSD));

        _;
    }

    function test_createSessionReverts() public doctorCreatedAndApproved {
        bytes[] memory barray = new bytes[](1);
        vm.startPrank(alice);

        vm.expectRevert("Doctor not found");
        ConsultEscrow.createSession(2, consultationFeePerHour, barray, address(PYUSD));

        vm.expectRevert("Insufficient contract ETH for oracle fee");
        ConsultEscrow.createSession(1, consultationFeePerHour, barray, address(PYUSD));

        vm.deal(address(ConsultEscrow), 1 ether);

        vm.expectRevert("Invalid payment");
        ConsultEscrow.createSession(1, consultationFeePerHour, barray, address(0x1));

        vm.expectRevert("Insufficient payment value");
        ConsultEscrow.createSession(1, 1e6, barray, address(USDT));

        vm.expectRevert("Insufficient pyUSD reserve");
        ConsultEscrow.createSession(1, consultationFeePerHour, barray, address(USDT));

        vm.startPrank(admin);
        PYUSD.approve(address(ConsultEscrow), consultationFeePerHour);
        ConsultEscrow.depositPyusdReserve(50e6);

        vm.startPrank(alice);
        USDT.approve(address(ConsultEscrow), consultationFeePerHour);
        ConsultEscrow.createSession(1, consultationFeePerHour, barray, address(USDT));
    }

    function test_createSessionsAllCoins() public doctorCreatedAndApproved {
        vm.deal(address(ConsultEscrow), 1 ether);

        bytes[] memory barray = new bytes[](1);
        uint256 updateFee = Pyth.getUpdateFee(barray);
        uint256 ConsultEscrowBalanceBefore = address(ConsultEscrow).balance;
        uint256 aliceBalanceBefore = alice.balance;

        vm.startPrank(admin);
        PYUSD.approve(address(ConsultEscrow), consultationFeePerHour);
        ConsultEscrow.depositPyusdReserve(50e6);

        // USDT
        vm.startPrank(alice);
        USDT.approve(address(ConsultEscrow), consultationFeePerHour);
        ConsultEscrow.createSession(1, consultationFeePerHour, barray, address(USDT));

        assertEq(USDT.balanceOf(alice), 0);
        assertEq(USDT.balanceOf(address(ConsultEscrow)), consultationFeePerHour);
        assertEq(address(ConsultEscrow).balance, ConsultEscrowBalanceBefore - updateFee);

        // USDC
        vm.startPrank(admin);
        PYUSD.approve(address(ConsultEscrow), 100e6);
        ConsultEscrow.depositPyusdReserve(100e6);
        uint256 ConsultEscrowBalanceBeforeUSDC = address(ConsultEscrow).balance;

        vm.startPrank(alice);
        USDC.approve(address(ConsultEscrow), consultationFeePerHour);
        ConsultEscrow.createSession(1, consultationFeePerHour, barray, address(USDC));

        assertEq(USDC.balanceOf(alice), 0);
        assertEq(USDC.balanceOf(address(ConsultEscrow)), consultationFeePerHour);
        assertEq(address(ConsultEscrow).balance, ConsultEscrowBalanceBeforeUSDC - updateFee);

        // PYUSD
        uint256 ConsultEscrowBalanceBeforePYUSD = address(ConsultEscrow).balance;
        uint256 PYUSDBalanceBefore = PYUSD.balanceOf(address(ConsultEscrow));
        vm.startPrank(alice);
        PYUSD.faucet(consultationFeePerHour);
        PYUSD.approve(address(ConsultEscrow), consultationFeePerHour);
        ConsultEscrow.createSession(1, consultationFeePerHour, barray, address(PYUSD));

        assertEq(PYUSD.balanceOf(alice), 0);
        assertEq(PYUSD.balanceOf(address(ConsultEscrow)), PYUSDBalanceBefore + consultationFeePerHour);
        assertEq(address(ConsultEscrow).balance, ConsultEscrowBalanceBeforePYUSD);

        // ETH
        vm.startPrank(admin);
        PYUSD.approve(address(ConsultEscrow), consultationFeePerHour);
        ConsultEscrow.depositPyusdReserve(50e6);

        vm.startPrank(alice);
        uint256 CEbalanceBeforeETH = address(ConsultEscrow).balance;
        uint256 currentSessionID = ConsultEscrow.numSessions();

        vm.expectEmit(true, true, true, true);
        emit ConsultationEscrow.SessionCreated(
            (currentSessionID + 1), 1, alice, consultationFeePerHour, consultationFeePerHour
        );
        uint256 BS = block.timestamp;
        ConsultEscrow.createSession{value: 0.02 ether}(1, consultationFeePerHour, barray, address(USDC));

        Structs.Session memory sessionss = ConsultEscrow.getSession(currentSessionID + 1);

        Structs.Session memory sessionss1 =
            Structs.Session(uint8(0), 1, (currentSessionID + 1), alice, consultationFeePerHour, BS);

        uint256[] memory patientSessiosn = ConsultEscrow.getPatientSessions(alice);
        uint256[] memory doctorSessions = ConsultEscrow.getDoctorSessions(1);

        assertEq(keccak256(abi.encode(sessionss)), keccak256(abi.encode(sessionss1)));
        assertEq(aliceBalanceBefore - 0.02 ether, alice.balance);
        assertEq(address(ConsultEscrow).balance, CEbalanceBeforeETH + 0.02 ether - updateFee);
        assertEq(doctorSessions[currentSessionID], patientSessiosn[currentSessionID]);
    }

    function test_releasePayment() public sessionsCreated {
        uint256 doctorBalanceBefore = PYUSD.balanceOf(doctor);
        uint256 EscrowBalanceBefore = PYUSD.balanceOf(address(ConsultEscrow));
        uint256 currentSessionID = ConsultEscrow.numSessions();
        vm.startPrank(admin);

        // vm.expectEmit(true, true, true, true);

        // ConsultEscrow.releasePayment(currentSessionID);
        // @Q No feature yet of setting the sessionID to complete?
    }
}
