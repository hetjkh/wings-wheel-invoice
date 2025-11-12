"use client";

import { useMemo } from "react";

// Next
import Link from "next/link";
import Image from "next/image";

// Assets
import Logo from "@/public/assets/img/invoify-logo.svg";

// ShadCn
import { Card } from "@/components/ui/card";

// Components
import { DevDebug, LanguageSelector, ThemeSwitcher, LoginModal, SignupModal, BaseButton } from "@/app/components";

// Contexts
import { useAuth } from "@/contexts/AuthContext";

// Icons
import { LogOut, User } from "lucide-react";

const BaseNavbar = () => {
    const devEnv = useMemo(() => {
        return process.env.NODE_ENV === "development";
    }, []);

    const { user, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
    };

    return (
        <header className="lg:container z-[99]">
            <nav>
                <Card className="flex flex-wrap justify-between items-center px-5 gap-5">
                    <Link href={"/"}>
                        <Image
                            src={Logo}
                            alt="Invoify Logo"
                            width={190}
                            height={100}
                            loading="eager"
                            style={{ height: "auto" }}
                        />
                    </Link>
                    <div className="flex items-center gap-3">
                        {/* ? DEV Only */}
                        {devEnv && <DevDebug />}
                        <LanguageSelector />
                        <ThemeSwitcher />
                        {user ? (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {user.email}
                                </span>
                                <BaseButton
                                    variant="outline"
                                    size="sm"
                                    onClick={handleLogout}
                                    tooltipLabel="Logout"
                                >
                                    <LogOut className="w-4 h-4" />
                                </BaseButton>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <LoginModal>
                                    <BaseButton variant="outline" size="sm">
                                        Login
                                    </BaseButton>
                                </LoginModal>
                                <SignupModal>
                                    <BaseButton variant="default" size="sm">
                                        Sign Up
                                    </BaseButton>
                                </SignupModal>
                            </div>
                        )}
                    </div>
                </Card>
            </nav>
        </header>
    );
};

export default BaseNavbar;
