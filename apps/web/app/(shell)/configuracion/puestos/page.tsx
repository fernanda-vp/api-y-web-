import type { JobTitleTreeNode } from "@intranet/api-client";
import { getApiClient } from "../../../lib/api";
import { isForbiddenError } from "../../../lib/errors";
import { getCurrentUser } from "../../../lib/permissions";
import { PermissionDenied } from "../_components/permission-denied";
import { JobTitlesTree } from "./_components/job-titles-tree";

export default async function PuestosPage() {
  const me = await getCurrentUser();

  let tree: JobTitleTreeNode[] | { forbidden: true };
  try {
    tree = await getApiClient().jobTitles.tree();
  } catch (err) {
    if (!isForbiddenError(err)) throw err;
    tree = { forbidden: true };
  }

  if (!Array.isArray(tree)) return <PermissionDenied />;

  return <JobTitlesTree tree={tree} permissions={me.permissions} />;
}
