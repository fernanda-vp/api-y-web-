import { getCurrentUser } from "../../lib/permissions";
import { MyProfileForm } from "./_components/my-profile-form";

export default async function MiPerfilPage() {
  const me = await getCurrentUser();

  return (
    <div className="p-6">
      <h1 className="mb-1 text-xl font-bold text-neutral-900">Mi Perfil</h1>
      <p className="mb-6 text-sm text-neutral-700">
        {me.name} {me.lastName} · @{me.username}
      </p>
      <MyProfileForm me={me} />
    </div>
  );
}
