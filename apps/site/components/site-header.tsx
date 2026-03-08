"use client"
import { Menu, X } from "lucide-react"
import Link from "next/link"
import React from "react"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { appLinks } from "@/lib/app-links"
import { useSiteI18n } from "@/lib/site-i18n"
import { cn } from "@/lib/utils"

export const SiteHeader = () => {
  const [menuState, setMenuState] = React.useState(false)
  const [isScrolled, setIsScrolled] = React.useState(false)
  const { locale, setLocale, t } = useSiteI18n()

  const menuItems = [
    { name: t.nav.features, href: "/" },
    { name: t.nav.solutions, href: "/price" },
    { name: t.nav.changelog, href: "/changelog" },
    { name: t.nav.platform, href: "#link" },
    { name: t.nav.roadmap, href: "#link" },
  ]

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header>
      <nav className="fixed z-20 w-full px-2" data-state={menuState && "active"}>
        <div
          className={cn(
            "mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12",
            isScrolled && "bg-background/50 max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-5"
          )}
        >
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
            <div className="flex w-full justify-between lg:w-auto">
              <Link aria-label="home" className="flex items-center space-x-2" href="/">
                <Logo />
              </Link>

              <button
                aria-label={menuState ? t.nav.closeMenu : t.nav.openMenu}
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
                onClick={() => setMenuState(!menuState)}
                type="button"
              >
                <Menu className="in-data-[state=active]:rotate-180 in-data-[state=active]:scale-0 in-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                <X className="in-data-[state=active]:rotate-0 in-data-[state=active]:scale-100 in-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
              </button>
            </div>

            <div className="absolute inset-0 m-auto hidden size-fit items-center gap-6 lg:flex">
              <ul className="flex gap-6 text-sm">
                {menuItems.map((item) => (
                  <li key={`${item.name}-${item.href}`}>
                    <Link
                      className="text-muted-foreground hover:text-foreground block transition-colors duration-150"
                      href={item.href}
                    >
                      <span>{item.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-background in-data-[state=active]:block lg:in-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
              <div className="lg:hidden">
                <ul className="space-y-6 text-base">
                  {menuItems.map((item) => (
                    <li key={`${item.name}-${item.href}`}>
                      <Link
                        className="text-muted-foreground hover:text-accent-foreground block duration-150"
                        href={item.href}
                      >
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                <div className="flex w-full items-center gap-1 rounded-full border p-1 md:w-auto">
                  <LangButton
                    active={locale === "zh"}
                    label={t.nav.languageZh}
                    onClick={() => setLocale("zh")}
                  />
                  <LangButton
                    active={locale === "en"}
                    label={t.nav.languageEn}
                    onClick={() => setLocale("en")}
                  />
                </div>
                <Button
                  asChild
                  className={cn(isScrolled && "lg:hidden")}
                  size="sm"
                  variant="outline"
                >
                  <Link href={appLinks.login}>
                    <span>{t.nav.login}</span>
                  </Link>
                </Button>
                <Button asChild className={cn(isScrolled && "lg:hidden")} size="sm">
                  <Link href={appLinks.signup}>
                    <span>{t.nav.signup}</span>
                  </Link>
                </Button>
                <Button asChild className={cn(isScrolled ? "lg:inline-flex" : "hidden")} size="sm">
                  <Link href={appLinks.signup}>
                    <span>{t.nav.getStarted}</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}

const LangButton = ({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) => (
  <button
    className={cn(
      "rounded-full px-3 py-1 text-xs transition-colors",
      active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
    )}
    onClick={onClick}
    type="button"
  >
    {label}
  </button>
)
