import type { NextPage } from "next";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import ReactCodeInput from "react-code-input";

import Image from "next/image";
import { useRouter } from "next/router";
import { useKryptikThemeContext } from "../ThemeProvider";
import { KryptikFetch } from "../../src/kryptikFetch";
import Link from "next/link";
import { isValidEmailAddress } from "../../src/helpers/resolvers/kryptikResolver";
import { useKryptikAuthContext } from "../KryptikAuthProvider";
import LoadingSpinner from "../loadingSpinner";
import { hasPasskeys } from "../../src/helpers/auth/passkey";
import {
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
} from "@simplewebauthn/browser";
import { isEmailTaken } from "../../src/helpers/user";
import { LoginFlow } from "../../src/models/LoginFlow";
import AuthProviderCard from "./CardAuthProvider";
import { AiOutlineLogin, AiOutlineMail } from "react-icons/ai";

enum LoginType {
  email = 0,
  passkey = 1,
}
const LoginCardWithOptions: NextPage = () => {
  const { signInWithToken, signInWithPasskey } = useKryptikAuthContext();
  const [email, setEmail] = useState("");
  const [sentEmail, setSentEmail] = useState(false);
  const [loadingApproval, setLoadingApproval] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initPasskeyFlow, setInitPasskeyFlow] = useState(false);
  const [redirectToPath, setRedirectToPath] = useState<null | string>(null);
  const [loginStep, setLoginStep] = useState<LoginFlow>(LoginFlow.Start);
  const sendLink: boolean = false;
  const { isDark } = useKryptikThemeContext();
  const [code, setCode] = useState("");
  const router = useRouter();
  const [loginType, setLoginType] = useState<LoginType>(LoginType.email);
  const [loadingMessage, setLoadingMessage] = useState("");
  function handleStatusUpdate(msg: string, progress?: number) {
    setLoadingMessage(msg);
  }

  useEffect(() => {
    // pull network ticker from route
    if (router.query["from"] && typeof router.query["from"] == "string") {
      const newFromPath = router.query["from"];
      setRedirectToPath(newFromPath);
    }
  }, [router.isReady]);

  async function sendEmailCode() {
    const params = {
      email: email,
      sendLink: sendLink,
    };
    try {
      const res = await KryptikFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(params),
        timeout: 8000,
        headers: { "Content-Type": "application/json" },
      });
      if (res.status != 200) {
        toast.error("Unable to login.");
        return;
      }
      setSentEmail(true);
      setLoading(false);
      setInitPasskeyFlow(false);
      toast.success("Email sent!");
      return;
    } catch (e) {
      setLoading(false);
      // adding events failed. notfy user.
      toast("Unable to send varification email.");
      return;
    }
  }

  async function loginWithPasskey(email: string, hasPasskey: boolean) {
    console.log("Logging in with passkey");
    setInitPasskeyFlow(true);
    setLoadingApproval(true);
    handleStatusUpdate("Building wallet on device.");
    setLoading(false);
    const approvedStatus: boolean = await signInWithPasskey(email, hasPasskey);
    if (approvedStatus) {
      toast.success("You are now logged in!");
      setLoadingApproval(false);
      setInitPasskeyFlow(false);
      // redirect to main page or previous (if set)
      if (redirectToPath) {
        router.push(redirectToPath);
      } else {
        router.push("/");
      }
      return;
    } else {
      toast("Trying email instead.");
      setLoadingApproval(false);
      setLoginType(LoginType.email);
      await sendEmailCode();
      return;
    }
  }

  async function handleLogin() {
    if (!isValidEmailAddress(email)) {
      toast.error("Please enter a valid email");
      return;
    }
    const hasPasskey = await hasPasskeys(email);
    const supportsPasskeys = await platformAuthenticatorIsAvailable();
    const browserSupportsPasskeys = browserSupportsWebAuthn();
    const emailTaken: boolean = await isEmailTaken(email);
    try {
      setLoading(true);
      // user must have email to initiate passkey flow
      // we don't want people to claim an email they don't posses
      if (
        hasPasskey &&
        emailTaken &&
        supportsPasskeys &&
        browserSupportsPasskeys
      ) {
        setLoginType(LoginType.passkey);
        loginWithPasskey(email, hasPasskey);
      } else {
        setLoginType(LoginType.email);
        sendEmailCode();
      }
    } catch (e) {
      toast.error("Unable to initiate login.");
      return;
    }
  }

  function handleEmailChange(newEmail: string) {
    setEmail(newEmail);
  }

  function handleStartPasskeyFlow() {
    setInitPasskeyFlow(true);
    setLoginStep(LoginFlow.SetPasskey);
  }

  function handleStartEmailFlow() {
    setInitPasskeyFlow(false);
    setLoginStep(LoginFlow.SetEmail);
  }

  function handleBack() {
    setLoginStep(LoginFlow.Start);
  }

  async function handleCodeChage(newCode: string) {
    setCode(newCode);
    if (newCode.length == 7) {
      setLoadingApproval(true);
      handleStatusUpdate("Building wallet on device.");
      const approvedStatus: boolean = await signInWithToken(newCode, email);
      if (approvedStatus) {
        toast.success("You are now logged in!");
        setLoadingApproval(false);
        // redirect to main page or previous (if set)
        if (redirectToPath) {
          router.push(redirectToPath);
        } else {
          router.push("/");
        }
        return;
      } else {
        setLoadingApproval(false);
        toast.error("Unable to verify code.");
        return;
      }
    }
  }

  return (
    <div className="dark:text-white">
      {loginStep == LoginFlow.Start && (
        <div>
          <div>
            <Image
              src="/kryptikBrand/kryptikEyez.png"
              className="rounded-full mx-auto"
              alt={"Kryptik Eyes"}
              width={40}
              height={40}
            />
            <p className="text-gray-700 dark:text-gray-400 text-lg font-semibold mb-4 text-center">
              Sign-in to Web3
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-4 max-w-sm mx-auto">
            <AuthProviderCard clickHandler={() => handleStartEmailFlow()}>
              {/* center content */}
              <div className="flex flex-col space-y-2 align-center">
                <AiOutlineMail size={30} className="self-center" />
                <p className="text-xl self-center">Email</p>
              </div>
            </AuthProviderCard>
            <AuthProviderCard
              clickHandler={() => {
                handleStartPasskeyFlow();
              }}
            >
              <div className="flex flex-col space-y-2">
                <AiOutlineLogin size={30} className="self-center" />
                <p className="text-xl self-center">Passkey</p>
              </div>
            </AuthProviderCard>
          </div>
        </div>
      )}
      {
        // passkey login

        loginStep == LoginFlow.SetPasskey && (
          <div>
            {initPasskeyFlow && (
              <div className="">
                <Image
                  src="/icons/orb.gif"
                  alt="Orb"
                  width={200}
                  height={200}
                  className="mx-auto rounded-xl"
                />
              </div>
            )}
          </div>
        )
      }
      {loginStep == LoginFlow.SetEmail && (
        <div className="bg-[#FBFDFD] dark:bg-gradient-to-br dark:to-[#0d0d0d] dark:from-[#0c0c0c] max-w-md mx-auto rounded-lg border border-solid dark:border-gray-800 border-gray-100 hover:dark:border-green-400 drop-shadow dark:text-white pt-2 px-2 pb-10 min-h-[280px]">
          <div className="flex flex-row mt-1">
            <div className="w-10 my-auto">
              <img
                src="/kryptikBrand/kryptikEyez.png"
                className="rounded-full"
              />
            </div>
            <h2 className="font-bold text-md ml-2 mb-1 text-transparent bg-clip-text bg-gradient-to-br from-blue-500 to-green-500">
              Kryptik
            </h2>
          </div>
          <div className="flex-grow">
            <h1 className="text-3xl font-bold text-center mb-4">Welcome</h1>
          </div>
          <div className="">
            {!sentEmail && loading && !initPasskeyFlow && (
              <div>
                <p className="text-xl font-semibold text-gray-700 dark:text-gray-200 text-center">
                  Sending email...
                </p>
              </div>
            )}
            {!loading && !sentEmail && !initPasskeyFlow && (
              <div className="px-6">
                <div className="flex flex-col mb-4">
                  <input
                    type="email"
                    className="bg-gray-200 dark:bg-gray-700 appearance-none border border-gray-200 rounded w-full py-3 px-4 text-gray-800 dark:text-white leading-tight focus:outline-none focus:bg-white focus:border-sky-400 dark:focus:border-sky-500 text-2xl"
                    id="inline-full-name"
                    placeholder="Enter your email"
                    required
                    onChange={(e) => handleEmailChange(e.target.value)}
                  />
                  <button
                    onClick={() => handleLogin()}
                    className={`bg-transparent hover:bg-green-500 text-green-500 text-2xl font-semibold hover:text-white py-2 px-4 ${
                      loading || sentEmail ? "hover:cursor-not-allowed" : ""
                    } border border-green-500 hover:border-transparent rounded-lg mt-5 mb-2`}
                    disabled={loading || sentEmail}
                  >
                    Sign In
                  </button>
                  <p className="text-gray-400 dark:text-gray-500 text-sm text-center">
                    If you already have an account, you will be logged in.
                  </p>
                </div>
                <div className="text-center max-w-2xl mx-auto content-center">
                  <Link href="../wallet/import">
                    <span className="text-sky-300 dark:text-sky-600 hover:cursor-pointer hover:text-blue transition-colors duration-300">
                      or import existing seed
                    </span>
                  </Link>
                </div>
              </div>
            )}
            {!loading && sentEmail && !loadingApproval && !initPasskeyFlow && (
              <div>
                <div className="mb-10 ml-[5%] md:ml-[14%]">
                  <ReactCodeInput
                    name="Your Code"
                    fields={7}
                    inputMode={"numeric"}
                    onChange={handleCodeChage}
                    disabled={loadingApproval}
                  />
                </div>
                <div className="flex flex-row text-center place-content-center">
                  <p className="text-md text-gray-600 dark:text-gray-300">
                    Enter your eight digit code.
                  </p>
                  {loadingApproval && <LoadingSpinner />}
                </div>
              </div>
            )}
            {initPasskeyFlow && (
              <div className="">
                <Image
                  src="/icons/orb.gif"
                  alt="Orb"
                  width={200}
                  height={200}
                  className="mx-auto rounded-xl"
                />
              </div>
            )}
            {loadingApproval && (
              <div className="flex flex-row text-center place-content-center mt-8">
                <p className="text-md text-gray-600 dark:text-gray-300">
                  {loadingMessage}
                </p>
                {loadingApproval && <LoadingSpinner />}
              </div>
            )}
          </div>
        </div>
      )}
      {loginStep != LoginFlow.Start && (
        <div
          className="text-center hover:cursor-pointer dark:text-gray-600 text-gray-300 mt-3"
          onClick={() => handleBack()}
        >
          <p>Back</p>
        </div>
      )}
    </div>
  );
};

export default LoginCardWithOptions;
