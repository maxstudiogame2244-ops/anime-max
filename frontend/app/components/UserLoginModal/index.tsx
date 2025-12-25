"use client";
import { AnimatePresence, motion } from "framer-motion";
import React, { MouseEventHandler, useState } from "react";
import styles from "./component.module.css";
import GoogleSvg from "@/public/assets/google-fill.svg";
import AnonymousSvg from "@/public/assets/person-fill.svg";
import CloseSvg from "@/public/assets/x.svg";
import LoadingSvg from "@/public/assets/Eclipse-1s-200px.svg";
import AnilistSvg from "@/public/assets/anilist.svg";
import UserSettingsModal from "@/app/layout/header/components/User/UserSettingsModal";
import { createNewUserDocument } from "@/app/lib/user/userLoginActions";
import {
  useAuthState,
  useSignIn,
  useSignUp,
  signInWithGoogle,
} from "@/app/lib/appwrite";

type ModalTypes = {
  onClick?: MouseEventHandler<HTMLDivElement>;
};

const framerMotionDropIn = {
  hidden: {
    x: "-100vw",
    opacity: 0,
  },
  visible: {
    x: "0",
    opacity: 1,
    transition: {
      duration: 0.2,
      damping: 25,
      type: "spring",
      stiffness: 500,
    },
  },
  exit: {
    x: "100vw",
    opacity: 0,
  },
};

export default function UserModal({ onClick }: ModalTypes) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState<boolean>(false);

  const [formType, setFormType] = useState<"login" | "signup">("login");
  const [loginError, setLoginError] = useState<{
    code: string;
    message: string;
  } | null>(null);

  const [user] = useAuthState();
  const { signInWithEmail, signInAnonymously } = useSignIn();
  const { signUp } = useSignUp();

  const handleSignInGoogle = async () => {
    try {
      signInWithGoogle();
    } catch (err) {
      setLoginError({
        code: (err as { code?: string }).code || "error",
        message: (err as { message?: string }).message || "An error occurred",
      });
    }
  };

  const handleSignAnonymously = async () => {
    try {
      const result = await signInAnonymously();
      if (result) {
        await createNewUserDocument({
          userAppwrite: result,
          openMenuFunctionHook: setIsSettingsMenuOpen,
        });
      }
    } catch (err) {
      setLoginError({
        code: (err as { code?: string }).code || "error",
        message: (err as { message?: string }).message || "An error occurred",
      });
    }
  };

  const signWithAnilist = async () => {
    window.location.href = `https://anilist.co/api/v2/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_ANILIST_CLIENT_ID}&response_type=token`;
  };

  async function handleLoginForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setIsLoading(true);

    const form = e.target as HTMLFormElement;

    try {
      const result = await signInWithEmail(
        form.email.value.trim(),
        form.password.value.trim()
      );
      if (result) {
        setLoginError(null);
      } else {
        setLoginError({
          code: "auth/invalid-credential",
          message: "Check Your Email and Password, then try again.",
        });
      }
    } catch (err) {
      setLoginError({
        code: (err as { code?: string }).code || "error",
        message:
          (err as { code?: string }).code == "auth/invalid-credential"
            ? "Check Your Email and Password, then try again."
            : (err as { message?: string }).message || "An error occurred",
      });
    }

    setIsLoading(false);
  }

  async function handleSignUpForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setIsLoading(true);

    const form = e.target as HTMLFormElement;

    try {
      const doesPasswordFieldsMatch =
        form.password.value.trim() == form.confirm_password.value.trim();

      if (!doesPasswordFieldsMatch) {
        setLoginError({
          code: "password",
          message: "Passwords doesn't match.",
        });

        setIsLoading(false);

        return;
      }

      const result = await signUp(
        form.email.value.trim(),
        form.password.value.trim(),
        form.username.value
      );

      if (result) {
        // add default values to user doc
        await createNewUserDocument({
          userAppwrite: result,
          openMenuFunctionHook: setIsSettingsMenuOpen,
        });

        setLoginError(null);
      }
    } catch (err) {
      setLoginError({
        code: (err as { code?: string }).code || "error",
        message: (err as { message?: string }).message || "An error occurred",
      });
    }

    setIsLoading(false);
  }

  // Required to customize the new User created on Settings panel
  if (user && isSettingsMenuOpen)
    return <UserSettingsModal onClick={onClick} newUser />;

  return (
    !user && (
      <motion.div
        id={styles.backdrop}
        onClick={onClick}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          data-disabled-scroll={true}
          onClick={(e) => e.stopPropagation()}
          id={styles.modal}
          variants={framerMotionDropIn}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div id={styles.heading}>
            <h5>Login with</h5>
            <button
              aria-label="Close User Panel"
              onClick={
                onClick as unknown as MouseEventHandler<HTMLButtonElement>
              }
            >
              <CloseSvg width={16} height={16} alt={"Close icon"} />
            </button>
          </div>

          <p className={styles.loggin_advice}>
            Use <b>Anilist</b> for better experience
          </p>

          <LoginAlternativesButtons
            anonymously={() => handleSignAnonymously()}
            withGoogle={() => handleSignInGoogle()}
            withAnilist={() => signWithAnilist()}
          />

          <div id={styles.span_container}>
            <span></span>
            <span>or</span>
            <span></span>
          </div>

          <motion.form
            onSubmit={(e) =>
              formType == "signup" ? handleSignUpForm(e) : handleLoginForm(e)
            }
            onChange={() => setLoginError(null)}
            data-error-occurred={loginError ? true : false}
          >
            <AnimatePresence>
              {formType == "signup" && (
                <motion.label
                  initial={{ opacity: 0, height: 0 }}
                  animate={{
                    opacity: 1,
                    height: "auto",
                    transition: { duration: 0.4 },
                  }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  Username
                  <input
                    type="text"
                    name="username"
                    pattern="^.{1,15}$"
                    title={"The limit is 15 characters."}
                    placeholder="Your Username"
                    required
                  ></input>
                </motion.label>
              )}
            </AnimatePresence>

            <label>
              Email
              <input
                type="email"
                name="email"
                placeholder="Your Email"
                required
              ></input>
            </label>

            <label>
              Password
              <input
                type="password"
                name="password"
                pattern="^(?=.*\d)(?=.*[a-zA-Z]).{8,}$"
                title={
                  "Password has to have at least 1 letter and 1 number. Min. 8 characters."
                }
                autoComplete={
                  formType == "signup" ? "new-password" : "current-password"
                }
                placeholder="Your Password"
                required
              ></input>
            </label>

            <AnimatePresence>
              {formType == "signup" && (
                <motion.label
                  initial={{ opacity: 0, height: 0, marginTop: "8px" }}
                  animate={{
                    opacity: 1,
                    height: "auto",
                    transition: { duration: 0.4 },
                  }}
                  exit={{ opacity: 0, height: 0, marginTop: "0" }}
                >
                  Confirm Password
                  <input
                    type="password"
                    name="confirm_password"
                    pattern="^(?=.*\d)(?=.*[a-zA-Z]).{8,}$"
                    title={
                      "Password has to have at least 1 letter and 1 number. Min. 8 characters."
                    }
                    placeholder="Your Password Again"
                    required
                  ></input>
                </motion.label>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              whileTap={{ scale: 0.95 }}
              disabled={isLoading}
            >
              <AnimatePresence>
                {isLoading ? (
                  <LoadingSvg width={16} height={16} alt={"Loading"} />
                ) : formType == "signup" ? (
                  <motion.span>SIGN UP</motion.span>
                ) : (
                  <motion.span>LOGIN</motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </motion.form>

          <AnimatePresence>
            {loginError && (
              <motion.p
                style={{
                  color: "var(--black-100)",
                  padding: "16px",
                  background: "var(--black-05)",
                }}
                initial={{
                  opacity: 0,
                  height: 0,
                }}
                animate={{
                  opacity: 1,
                  height: "auto",
                }}
                exit={{
                  opacity: 0,
                  height: 0,
                }}
              >
                <span style={{ color: "var(--error)" }}>
                  {loginError.code}:
                </span>{" "}
                {loginError.message}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            id={styles.create_account_button}
            onClick={() =>
              setFormType(formType == "signup" ? "login" : "signup")
            }
          >
            {formType == "signup"
              ? "Or Login in Your Account"
              : "Or Create Your Account"}
          </motion.button>
        </motion.div>
      </motion.div>
    )
  );
}

function LoginAlternativesButtons({
  withGoogle,
  anonymously,
  withAnilist,
}: {
  withGoogle: () => void;
  anonymously: () => void;
  withAnilist: () => void;
}) {
  return (
    <div id={styles.login_buttons_container}>
      <div>
        <button
          title="Google"
          id={styles.google_button}
          onClick={() => withGoogle()}
        >
          <GoogleSvg width={16} height={16} alt={"Google icon"} />
        </button>
        <small>Google</small>
      </div>

      <div>
        <button
          title="Anonymously"
          id={styles.anonymous_button}
          onClick={() => anonymously()}
        >
          <AnonymousSvg width={16} height={16} alt={"Anonymous icon"} />
        </button>
        <small>Anonymously</small>
      </div>

      <div>
        <button
          title="Anilist"
          id={styles.anilist_button}
          onClick={() => withAnilist()}
        >
          <AnilistSvg width={16} height={16} alt={"Anilist icon"} />
        </button>
        <small>Anilist</small>
      </div>
    </div>
  );
}
