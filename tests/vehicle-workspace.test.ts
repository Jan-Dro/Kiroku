import { describe, expect, it } from "vitest";
import {
  getVehicleWorkspaceAction,
  getVehicleWorkspaceSection,
} from "@/lib/vehicle-workspace";

describe("vehicle workspace routing", () => {
  const vehicleId = "abc123";

  it("maps each vehicle route to the expected section", () => {
    expect(getVehicleWorkspaceSection(`/vehicles/${vehicleId}`, vehicleId)).toBe("overview");
    expect(getVehicleWorkspaceSection(`/vehicles/${vehicleId}/fuel`, vehicleId)).toBe("fuel");
    expect(getVehicleWorkspaceSection(`/vehicles/${vehicleId}/service`, vehicleId)).toBe("service");
    expect(getVehicleWorkspaceSection(`/vehicles/${vehicleId}/expenses`, vehicleId)).toBe("expenses");
    expect(getVehicleWorkspaceSection(`/vehicles/${vehicleId}/upgrades`, vehicleId)).toBe("upgrades");
    expect(getVehicleWorkspaceSection(`/vehicles/${vehicleId}/notes`, vehicleId)).toBe("notes");
    expect(getVehicleWorkspaceSection(`/vehicles/${vehicleId}/documents`, vehicleId)).toBe("documents");
  });

  it("derives the expected contextual action for each section", () => {
    expect(getVehicleWorkspaceAction("overview")).toEqual({ type: "record", label: "Add record" });
    expect(getVehicleWorkspaceAction("fuel")).toEqual({
      type: "record",
      label: "Add fuel",
      recordType: "fuel",
    });
    expect(getVehicleWorkspaceAction("service")).toEqual({
      type: "record",
      label: "Add service",
      recordType: "maintenance",
    });
    expect(getVehicleWorkspaceAction("expenses")).toEqual({
      type: "record",
      label: "Add expense",
      recordType: "expense",
    });
    expect(getVehicleWorkspaceAction("upgrades")).toEqual({
      type: "record",
      label: "Add upgrade",
      recordType: "upgrade",
    });
    expect(getVehicleWorkspaceAction("notes")).toEqual({
      type: "record",
      label: "Add note",
      recordType: "note",
    });
    expect(getVehicleWorkspaceAction("documents")).toEqual({
      type: "document",
      label: "Upload document",
    });
  });
});
