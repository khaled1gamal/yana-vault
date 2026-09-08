import { AdminScreen } from "@/components/admin/AdminScreen";
import { RequireAuth } from "@/components/auth/RequireAuth";

export default function AdminPage() {
  return (
    <RequireAuth roles={["admin"]}>
      <AdminScreen />
    </RequireAuth>
  );
}
