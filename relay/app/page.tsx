import { RelayProvider } from "@/lib/store";
import { Shell } from "@/components/Shell";
import { auth } from "@/auth";
import type { SessionUser } from "@/components/UserMenu";

export default async function Page() {
  const session = await auth();
  const user = (session?.user as SessionUser) ?? null;
  return (
    <RelayProvider>
      <Shell user={user} />
    </RelayProvider>
  );
}
