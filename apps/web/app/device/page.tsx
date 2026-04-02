import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { DeviceApprovalCard } from "@/components/device-approval-card"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

function buildLoginRedirect(userCode: string) {
  const target = userCode ? `/device?user_code=${encodeURIComponent(userCode)}` : "/device"
  return `/login?redirect=${encodeURIComponent(target)}`
}

export default async function DevicePage({
  searchParams,
}: {
  searchParams: Promise<{ user_code?: string }>
}) {
  const { user_code: userCode = "" } = await searchParams
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user?.id) {
    redirect(buildLoginRedirect(userCode))
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted p-6 md:p-10">
      <DeviceApprovalCard
        initialUserCode={userCode}
        userName={session.user.name || session.user.email || "当前账户"}
      />
    </div>
  )
}
