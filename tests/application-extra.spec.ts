import { test, expect, type Request } from "@playwright/test";
import { resetDatabase, createUser, loginUser, createBlog } from "./helpers";

// These scenarios exercise several complete flows, including cold development compilation.
test.setTimeout(90_000);

test.beforeEach(async () => {
  await resetDatabase();
});

test("registration rejects short passwords and duplicate usernames", async ({
  page,
}) => {
  await createUser("existing", "Existing Reader", "password123");
  await page.goto("/register");
  await page.getByLabel("Username", { exact: true }).fill("existing");
  await page.getByLabel("Name", { exact: true }).fill("New Reader");
  await page.getByLabel("Password", { exact: true }).fill("abc");
  await page.getByLabel("Confirm Password", { exact: true }).fill("abc");
  await page.getByTestId("register-button").click();
  await expect(page.getByTestId("password-error")).toBeVisible();
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page
    .getByLabel("Confirm Password", { exact: true })
    .fill("password123");
  await page.getByTestId("register-button").click();
  await expect(page.getByTestId("username-error")).toContainText(
    "already taken",
  );
});

test("blog values survive validation and creator can edit, like, and delete", async ({
  page,
}) => {
  await createUser("owner", "Blog Owner", "password123");
  await loginUser(page, "owner", "password123");
  await page.goto("/blogs/new");
  await page.getByLabel("Title", { exact: true }).fill("Bad");
  await page.getByLabel("Author", { exact: true }).fill("A");
  await page.getByLabel("URL", { exact: true }).fill("bad");
  await page.getByTestId("create-blog-button").click();
  for (const field of ["title", "author", "url"])
    await expect(page.getByTestId(field + "-error")).toBeVisible();
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue("Bad");
  await expect(page.getByLabel("Author", { exact: true })).toHaveValue("A");
  await expect(page.getByLabel("URL", { exact: true })).toHaveValue("bad");
  await createBlog(
    page,
    "Original Article",
    "Original Author",
    "https://example.com/article",
  );
  await page.goto("/me");
  await expect(page.getByTestId("unread-section")).toContainText(
    "Original Article",
  );
  await page
    .getByRole("link", { name: "Original Article", exact: true })
    .click();
  await page.getByTestId("like-blog-button").click();
  await expect(page.getByTestId("blog-likes")).toContainText("1 likes");
  await page.getByRole("link", { name: "Edit", exact: true }).click();
  await page.getByLabel("Title", { exact: true }).fill("Updated Article");
  await page.getByTestId("save-blog-button").click();
  await expect(page.getByTestId("blog-title")).toHaveText("Updated Article");
  await page.getByTestId("delete-blog-button").click();
  await expect(page).toHaveURL("/blogs");
  await expect(page.getByTestId("blogs-list")).not.toContainText(
    "Updated Article",
  );
  await page.goto("/me");
  await expect(page.getByTestId("empty-reading-list")).toBeVisible();
});

test("another user cannot delete a blog through a direct Server Action request", async ({
  page,
  browser,
}) => {
  await createUser("owner", "Blog Owner", "password123");
  await createUser("reader", "Other Reader", "password123");
  await loginUser(page, "owner", "password123");
  await createBlog(
    page,
    "Protected Article",
    "Original Author",
    "https://example.com/article",
  );
  await page
    .getByRole("link", { name: "Protected Article", exact: true })
    .click();
  await page.waitForURL(/\/blogs\/\d+$/);
  const detailUrl = page.url();
  let captured: Request | undefined;
  await page.route("**/blogs/*", async (route) => {
    if (route.request().headers()["next-action"]) {
      captured = route.request();
      await route.abort();
    } else await route.continue();
  });
  await page.getByTestId("delete-blog-button").click();
  await expect.poll(() => Boolean(captured)).toBe(true);
  await page.unroute("**/blogs/*");
  const other = await browser.newContext({ baseURL: "http://localhost:3000" });
  try {
    const reader = await other.newPage();
    await loginUser(reader, "reader", "password123");
    await reader.goto(detailUrl);
    await expect(reader.getByTestId("delete-blog-button")).not.toBeVisible();
    await reader.goto(detailUrl + "/edit");
    await expect(
      reader.getByRole("heading", { name: "Page not found" }),
    ).toBeVisible();
    const request = captured!;
    const response = await other.request.post(request.url(), {
      headers: {
        "next-action": request.headers()["next-action"],
        "content-type": request.headers()["content-type"],
        origin: "http://localhost:3000",
        accept: "text/x-component",
      },
      data: request.postDataBuffer()!,
    });
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain(
      "You can only delete your own blogs.",
    );
    await reader.goto(detailUrl);
    await expect(reader.getByTestId("blog-title")).toHaveText(
      "Protected Article",
    );
  } finally {
    await other.close();
  }
});

test("API token authenticates a safe profile and rotation revokes the old token", async ({
  page,
  request,
}) => {
  await createUser("reader", "API Reader", "password123");
  expect((await request.get("/api/me")).status()).toBe(401);
  expect(
    (
      await request.get("/api/me", {
        headers: { Authorization: "Bearer invalid" },
      })
    ).status(),
  ).toBe(401);
  await loginUser(page, "reader", "password123");
  await page.goto("/me");
  await page.getByTestId("generate-token-button").click();
  const first = await page.getByTestId("api-token").innerText();
  const valid = await request.get("/api/me", {
    headers: { Authorization: "Bearer " + first },
  });
  expect(valid.status()).toBe(200);
  expect(await valid.json()).toEqual({
    id: expect.any(Number),
    username: "reader",
    name: "API Reader",
  });
  await page.getByTestId("generate-token-button").click();
  await expect(page.getByTestId("api-token")).not.toHaveText(first);
  expect(
    (
      await request.get("/api/me", {
        headers: { Authorization: "Bearer " + first },
      })
    ).status(),
  ).toBe(401);
});

test("reading list rejects duplicates and read status survives a reload", async ({
  page,
}) => {
  await createUser("owner", "Blog Owner", "password123");
  await createUser("reader", "Other Reader", "password123");
  await loginUser(page, "owner", "password123");
  await createBlog(
    page,
    "Reading Article",
    "Original Author",
    "https://example.com/article",
  );
  await loginUser(page, "reader", "password123");
  await page.goto("/blogs");
  await page
    .getByRole("link", { name: "Reading Article", exact: true })
    .click();
  const captured = page.waitForRequest((request) =>
    Boolean(request.headers()["next-action"]),
  );
  await page.getByTestId("add-to-reading-list-button").click();
  const action = await captured;
  await expect(page.getByText("Saved in your reading list")).toBeVisible();
  await page.request.post(action.url(), {
    headers: {
      "next-action": action.headers()["next-action"],
      "content-type": action.headers()["content-type"],
      origin: "http://localhost:3000",
      accept: "text/x-component",
    },
    data: action.postDataBuffer()!,
  });
  await page.goto("/me");
  await expect(
    page
      .getByTestId("unread-section")
      .getByRole("link", { name: "Reading Article" }),
  ).toHaveCount(1);
  await page.getByRole("button", { name: "Mark as Read" }).click();
  await expect(page.getByTestId("read-section")).toContainText(
    "Reading Article",
  );
  await page.reload();
  await expect(page.getByTestId("no-unread-blogs")).toBeVisible();
  await expect(page.getByTestId("read-section")).toContainText(
    "Reading Article",
  );
});

test("username pages and bookmarkable filters work; responsive pages have no overflow", async ({
  page,
}, testInfo) => {
  await createUser("reader", "A Curious Reader", "password123");
  await loginUser(page, "reader", "password123");
  await createBlog(
    page,
    "React Patterns",
    "Original Author",
    "https://example.com/react",
  );
  await createBlog(
    page,
    "Next.js Patterns",
    "Original Author",
    "https://example.com/next",
  );
  await page.goto("/blogs?filter=React");
  await expect(page.getByTestId("blogs-list")).toContainText("React Patterns");
  await expect(page.getByTestId("blogs-list")).not.toContainText(
    "Next.js Patterns",
  );
  await page
    .getByRole("link", { name: "A Curious Reader", exact: true })
    .click();
  await expect(page).toHaveURL("/users/reader");
  await expect(
    page.getByRole("link", { name: "React Patterns" }),
  ).toBeVisible();
  await page.goto("/");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: testInfo.outputPath("home-desktop.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ["/", "/blogs", "/me", "/register", "/login"]) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.goto("/");
  await page.screenshot({
    path: testInfo.outputPath("home-mobile.png"),
    fullPage: true,
  });
});
