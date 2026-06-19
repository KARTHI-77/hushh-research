import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OneDashboardPage } from "@/components/dashboard/one-dashboard-page";
import { ROUTES } from "@/lib/navigation/routes";

describe("OneDashboardPage", () => {
  it("renders the primary One agent modes with route targets", () => {
    render(
      <OneDashboardPage displayName="Kushal Trivedi" pendingConsents={2} />,
    );

    expect(screen.getByTestId("page-header")).toBeTruthy();
    expect(screen.getByText("Good to see you, Kushal.")).toBeTruthy();
    const financeLink = screen.getByRole("link", { name: "Open Finance" });
    expect(financeLink.getAttribute("href")).toBe(ROUTES.KAI_HOME);
    expect(financeLink.className).not.toContain("translate");
    expect(
      screen.getByRole("link", { name: "Open Gmail" }).getAttribute("href"),
    ).toBe(ROUTES.GMAIL);
    expect(
      screen.getByRole("link", { name: "Open Email" }).getAttribute("href"),
    ).toBe(ROUTES.ONE_KYC);
    expect(
      screen.getByRole("link", { name: "Open Location" }).getAttribute("href"),
    ).toBe(ROUTES.ONE_LOCATION);
    expect(
      screen
        .getByRole("link", { name: "Open Personal Data" })
        .getAttribute("href"),
    ).toBe(ROUTES.PKM);
    expect(
      screen
        .getByRole("link", { name: "Open Consent Guardian" })
        .getAttribute("href"),
    ).toBe("/consents?tab=pending");
    expect(
      screen
        .getByRole("link", { name: "Open Connected Systems" })
        .getAttribute("href"),
    ).toBe(ROUTES.CONNECTED_SYSTEMS);
    expect(screen.queryByRole("link", { name: "Open One Agent" })).toBeNull();
  });
});
