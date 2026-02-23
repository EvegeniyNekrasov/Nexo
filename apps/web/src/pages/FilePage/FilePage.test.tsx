import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import FilesPage from "./FilesPage";

function mockFetchOnce(data: any, ok = true, status = 200) {
  (globalThis.fetch as any).mockResolvedValueOnce({
    ok,
    status,
    json: async () => data,
  });
}

describe("FilesPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("renders list of files from API", async () => {
    mockFetchOnce({
      files: [
        { id: "1", name: "Alpha", createdAt: new Date().toISOString() },
        { id: "2", name: "Beta", createdAt: new Date().toISOString() },
      ],
    });

    render(
      <MemoryRouter>
        <FilesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Alpha")).toBeInTheDocument();
    expect(await screen.findByText("Beta")).toBeInTheDocument();
  });

  it("creates a file via POST /files", async () => {
    mockFetchOnce({ files: [] });

    mockFetchOnce(
      { id: "x", name: "Untitled", createdAt: new Date().toISOString() },
      true,
      201,
    );

    render(
      <MemoryRouter>
        <FilesPage />
      </MemoryRouter>,
    );

    await screen.findAllByText("Nexo");

    const button = screen.getAllByText("Crear");
    button.forEach((b) => fireEvent.click(b));

    expect(globalThis.fetch).toHaveBeenCalled();
    const calls = (globalThis.fetch as any).mock.calls as any[];
    // 1st call: GET /files, 2nd call: POST /files
    expect(calls[1][0]).toMatch(/\/files$/);
    expect(calls[1][1].method).toBe("POST");
  });
});
