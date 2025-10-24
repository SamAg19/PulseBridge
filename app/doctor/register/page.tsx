'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useReadContract, useChainId, useConfig, useAccount, useWriteContract } from 'wagmi'
import Link from 'next/link';
import { registerDoctorWithWallet, checkDoctorRegistration } from '@/lib/firebase/auth';
import { DoctorProfile } from '@/lib/types';
import { readContract } from "@wagmi/core"
import { stringToHex, padHex, formatUnits } from 'viem'
import { chains, DoctorRegistry, erc20Abi } from "@/constants"


export default function DoctorRegisterPage() {
    const { address, isConnected } = useAccount();
    const chainId = useChainId()
    const DocRegistry = chains[chainId]["DoctorRegistry"]
    const PYUSD = chains[chainId]["PYUSD"]
    const config = useConfig()

    // PINATA
    const [file, setFile] = useState<File>();
    const [url, setUrl] = useState("");
    const [uploading, setUploading] = useState(false);

    const router = useRouter();
    const [formData, setFormData] = useState({
        fullName: '',
        specialization: '',
        licenseNumber: '',
        email: '',
        paymentwallet: '',
        consultationfee: '',
        profileDescription: '',

    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [fee, setFee] = useState("0");
    const [stake, setStake] = useState("0")
    const [checkingRegistration, setCheckingRegistration] = useState(true);
    const [doctorData, setDoctorData] = useState<(DoctorProfile & { id: string; walletAddress: string }) | null>(null);
    const { data: hash, isPending, writeContractAsync } = useWriteContract()

    const uploadFile = async () => {
        try {
            if (!file) {
                alert("No file selected");
                return;
            }

            setUploading(true);
            const data = new FormData();
            data.set("file", file);
            const uploadRequest = await fetch("/api/files", {
                method: "POST",
                body: data,
            });
            const cid = await uploadRequest.json();
            setUrl(cid);
            setFormData({ ...formData, licenseNumber: cid });
            setUploading(false);


        } catch (e) {
            console.log(e);
            setUploading(false);
            alert("Trouble uploading file");
        }
    };


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFile(e.target?.files?.[0]);
    };

    useEffect(() => {
        if (!isConnected) {
            router.push('/');
            return;
        }

        // Check if doctor is already registered
        const checkRegistration = async () => {

            if (!address) {
                try {
                    //backend stuff.
                    const data = await checkDoctorRegistration(String(address));
                    const isDoc = await getDoctor();
                    if (isDoc && data) {

                        if (isDoc != 0) {
                            router.push('/dashboard');
                        } else {
                            router.push('/doctor/pending');
                        }
                        return;
                    }
                } catch (error) {
                    // Doctor not registered, continue with registration
                    console.log('Doctor not registered, continuing with registration');
                }
            }
            setCheckingRegistration(false);
            await getFees()
        };

        checkRegistration();
    }, [address, isConnected, router]);


    async function getDoctor(): Promise<Number> {

        if (!address || !address.startsWith('0x') || address.length !== 42) {
            throw new Error('Invalid address format')
        }

        const isDoctor = await readContract(config, {
            abi: DoctorRegistry,
            address: DocRegistry as `0x${string}`,
            functionName: 'getDoctorID',
            args: [address as `0x${string}`],
        })
        return Number(isDoctor)
    }

    async function getFees(): Promise<[number, number]> {

        const stakeAmount = await readContract(config, {

            abi: DoctorRegistry,
            address: DocRegistry as `0x${string}`,
            functionName: 'stakeAmount',
        })

        const depositFee = await readContract(config, {

            abi: DoctorRegistry,
            address: DocRegistry as `0x${string}`,
            functionName: 'depositFee',
        })
        console.log(depositFee, stakeAmount);


        setFee(formatUnits(depositFee as bigint, 6))
        setStake(formatUnits(stakeAmount as bigint, 6))

        return [Number(stakeAmount), Number(depositFee)];


    }

    async function getApprovedPYUSD(): Promise<bigint> {

        const response = await readContract(config, {

            abi: erc20Abi,
            address: PYUSD as `0x${string}`,
            functionName: `allowance`,
            args: [address as `0x${string}`, DocRegistry as `0x${string}`]
        })

        const [stakeAmount, depositFee] = await getFees();
        const stakeAmountBigInt = BigInt(stakeAmount);
        const responseBigInt = response as bigint;

        if (stakeAmountBigInt > responseBigInt) {
            if (responseBigInt === BigInt(0)) {
                await writeContractAsync({
                    abi: erc20Abi,
                    address: PYUSD as `0x${string}`,
                    functionName: "approve",
                    args: [
                        DocRegistry as `0x${string}`,
                        stakeAmountBigInt,
                    ],
                })

            } else {
                const unapprovedAmount = stakeAmountBigInt - responseBigInt;

                await writeContractAsync({
                    abi: erc20Abi,
                    address: PYUSD as `0x${string}`,
                    functionName: "approve",
                    args: [
                        DocRegistry as `0x${string}`,
                        unapprovedAmount,
                    ],
                })

            }
        }
        return responseBigInt;
    }




    async function registerAsDoctor() {
        const licenseNumberBytes32 = padHex(stringToHex(formData.licenseNumber), { size: 32 });

        await getApprovedPYUSD();

        await writeContractAsync({
            abi: DoctorRegistry,
            address: DocRegistry as `0x${string}`,
            functionName: "registerAsDoctor",
            args: [
                formData.fullName,
                formData.specialization,
                formData.profileDescription,
                formData.email,
                formData.consultationfee,
                formData.licenseNumber, // fix this..
            ],

        })

        // Depending on outcome show a popup or something..

    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!address) return;

        setError('');
        setLoading(true);

        try {
            await registerAsDoctor(); // Remove the 'e' parameter from registerAsDoctor
            router.push('/doctor/pending');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isConnected) {
        return null;
    }

    if (checkingRegistration) {
        return (
            <div className="min-h-screen medical-gradient flex items-center justify-center">
                <div className="glass-card p-8 rounded-2xl">
                    <div className="text-primary text-xl font-medium">Checking registration status...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen medical-gradient py-12 px-4 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 opacity-20 rounded-full animate-float"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-300 opacity-15 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="relative z-10 max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8 animate-fadeInUp">
                    <div className="inline-flex items-center justify-center w-20 h-20 glass-effect rounded-full mb-6 shadow-lg">
                        <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-5xl font-bold text-primary mb-3">Doctor Registration</h1>
                    <p className="text-xl text-secondary font-medium">Complete your profile to get verified</p>
                    <p className="text-blue-600 mt-2 font-mono text-sm bg-white px-3 py-1 rounded-full inline-block">
                        Wallet: {address?.slice(0, 6)}...{address?.slice(-4)}
                    </p>
                </div>

                {/* Main form card */}
                <div className="glass-card rounded-2xl p-8 shadow-2xl animate-slideInRight">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm animate-fadeInUp">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {error}
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="fullName" className="block text-sm font-semibold text-primary mb-2">
                                    Full Name
                                </label>
                                <input
                                    id="fullName"
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    className="w-full px-4 py-4 bg-white border border-blue-200 rounded-xl text-gray-900 placeholder-gray-500 input-focus focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Dr. John Smith"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-semibold text-primary mb-2">
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-4 bg-white border border-blue-200 rounded-xl text-gray-900 placeholder-gray-500 input-focus focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="doctor@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="specialization" className="block text-sm font-semibold text-primary mb-2">
                                    Specialization
                                </label>
                                <input
                                    id="specialization"
                                    type="text"
                                    value={formData.specialization}
                                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                    className="w-full px-4 py-4 bg-white border border-blue-200 rounded-xl text-gray-900 placeholder-gray-500 input-focus focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Cardiology"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="consultationfee" className="block text-sm font-semibold text-primary mb-2">
                                    Consultation Fee per hour
                                </label>
                                <input
                                    id="consultationfee"
                                    type="number"
                                    value={formData.consultationfee}
                                    onChange={(e) => setFormData({ ...formData, consultationfee: e.target.value })}
                                    className="w-full px-4 py-4 bg-white border border-blue-200 rounded-xl text-gray-900 placeholder-gray-500 input-focus focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="$100"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="paymentwallet" className="block text-sm font-semibold text-primary mb-2">
                                    Payment Wallet
                                </label>
                                <input
                                    id="paymentwallet"
                                    type="text"
                                    value={formData.paymentwallet}
                                    // onClick={(e) => setFormData({ ...formData, paymentwallet: address })}
                                    onChange={(e) => setFormData({ ...formData, paymentwallet: e.target.value })}
                                    className="w-full px-4 py-4 bg-white border border-blue-200 rounded-xl text-gray-900 placeholder-gray-500 input-focus focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder={`${address}`}
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="licenseNumber" className="block text-sm font-semibold text-primary mb-2">
                                    License Document
                                </label>
                                <input type="file" onChange={handleChange} required />
                                <button type="button" className="w-full px-3 py-3 bg-white border border-blue-200 rounded-xl text-gray-900 placeholder-gray-500 input-focus focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={uploading} onClick={uploadFile} >
                                    {uploading ? "Uploading..." : "Upload"}
                                </button>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-1 gap-5">
                            <div>
                                <label htmlFor="specialization" className="block text-sm font-semibold text-primary mb-2">
                                    Profile Description
                                </label>
                                <input
                                    id="specialization"
                                    type="text"
                                    value={formData.profileDescription}
                                    onChange={(e) => setFormData({ ...formData, profileDescription: e.target.value })}
                                    className="w-full px-5 py-10 bg-white border border-blue-200 rounded-xl text-gray-900 placeholder-gray-500 input-focus focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Describe yourself to your new clients!"
                                    required
                                />
                            </div>


                        </div>
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                            <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Registration Fees
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                    <p className="text-sm text-gray-600 mb-1">Deposit Fee</p>
                                    <p className="text-2xl font-bold text-blue-600">${fee}</p>
                                    <p className="text-xs text-gray-500 mt-1">One-time payment</p>
                                </div>
                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                    <p className="text-sm text-gray-600 mb-1">Stake Amount</p>
                                    <p className="text-2xl font-bold text-blue-600">${stake}</p>
                                    <p className="text-xs text-gray-500 mt-1">Refundable</p>
                                </div>
                            </div>
                            <p className="text-xs text-gray-600 mt-4 flex items-start">
                                <svg className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <b>Total required: {stake} PYUSD. The stake amount will be returned when your account has been activated.</b>
                            </p>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary text-white font-semibold py-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Registering...
                                </div>
                            ) : (
                                'Submit for Verification'
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <Link href="/" className="text-blue-600 hover:text-blue-800 transition-colors font-medium">
                            ← Back to home
                        </Link>
                    </div>
                </div>

                {/* Additional info */}
                <div className="text-center mt-6 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
                    <div className="glass-effect p-4 rounded-xl inline-block">
                        <p className="text-blue-600 text-sm font-medium">
                            🔒 Your information will be reviewed for verification within 24-49 hours
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}