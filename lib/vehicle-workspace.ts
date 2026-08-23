export type VehicleWorkspaceRecordType = "fuel" | "maintenance" | "expense" | "upgrade" | "note";

export type VehicleWorkspaceAction =
  | { type: "record"; label: string; recordType?: VehicleWorkspaceRecordType }
  | { type: "document"; label: string };

export type VehicleWorkspaceSection =
  | "overview"
  | "fuel"
  | "service"
  | "expenses"
  | "upgrades"
  | "notes"
  | "documents";

export function getVehicleWorkspaceSection(pathname: string, vehicleId: string): VehicleWorkspaceSection {
  const basePath = `/vehicles/${vehicleId}`;

  if (pathname === `${basePath}/fuel`) {
    return "fuel";
  }

  if (pathname === `${basePath}/service`) {
    return "service";
  }

  if (pathname === `${basePath}/expenses`) {
    return "expenses";
  }

  if (pathname === `${basePath}/upgrades`) {
    return "upgrades";
  }

  if (pathname === `${basePath}/notes`) {
    return "notes";
  }

  if (pathname === `${basePath}/documents`) {
    return "documents";
  }

  return "overview";
}

export function getVehicleWorkspaceAction(section: VehicleWorkspaceSection): VehicleWorkspaceAction {
  switch (section) {
    case "fuel":
      return { type: "record", label: "Add fuel", recordType: "fuel" };
    case "service":
      return { type: "record", label: "Add service", recordType: "maintenance" };
    case "expenses":
      return { type: "record", label: "Add expense", recordType: "expense" };
    case "upgrades":
      return { type: "record", label: "Add upgrade", recordType: "upgrade" };
    case "notes":
      return { type: "record", label: "Add note", recordType: "note" };
    case "documents":
      return { type: "document", label: "Upload document" };
    default:
      return { type: "record", label: "Add record" };
  }
}
