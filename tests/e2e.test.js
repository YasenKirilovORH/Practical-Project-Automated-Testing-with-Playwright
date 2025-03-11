const { test, describe, beforeEach, afterEach, beforeAll, afterAll, expect } = require("@playwright/test");
const { chromium } = require("playwright");

const host = 'http://localhost:3000';
let browser;
let context;
let page;

let user = {
    email: "",
    password: "123456",
    confirmPassword: "123456"
};

let game = {
    title: "",
    category: "",
    id: "",
    maxLevel: "99",
    imageUrl: "https://upload.wikimedia.org/wikipedia/en/7/79/DmC_box_art.png",
    summary: "Amazing game"
};

describe("e2e tests", () => {
    beforeAll(async () => {
        browser = await chromium.launch();
    });

    afterAll(async () => {
        await browser.close();
    });

    beforeEach(async () => {
        context = await browser.newContext();
        page = await context.newPage();
    });

    afterEach(async () => {
        await page.close();
        await context.close();
    });

    describe("Authentication", () => {
        test("Register with valid data redirects to correct page", async () => {
            // Arrange
            await page.goto(host);
            await page.click("text=Register");
            await page.waitForSelector("form");

            let random = Math.floor(Math.random() * 1000);
            user.email =`yasen${random}@abv.bg`;

            // Act
            await page.fill('input[name="email"]', user.email);
            await page.fill('input[name="password"]', user.password);
            await page.fill('input[name="confirm-password"]', user.confirmPassword);
            await page.click('input[type="submit"]');

            // Assert
            await expect(page.locator("//a[text()='Logout']")).toBeVisible();
            expect(page.url()).toBe(host + '/')
        });

        test("Register with empty fields", async () => {
            // Arrange
            await page.goto(host);
            await page.click("//a[text()='Register']");
            await page.waitForSelector("form");

            // Act
            page.on('dialog', async dialog => {
                expect(dialog.message()).toBe("No empty fields are allowed and confirm password has to match password!");
                await dialog.accept();
            });

            await page.click('//input[@type="submit"]');
            expect(page.url()).toBe(host + "/register");
        });

        test("Login with valid credentials", async () => {
            // Arrange
            await page.goto(host);
            await page.click('//a[@href="/login"]');
            await page.waitForSelector("form");

            // Act
            await page.fill('input[name="email"]', user.email);
            await page.fill('input[name="password"]', user.password);
            await page.click('input[type="submit"]');

            // Assert
            await expect(page.locator('//a[@href="/logout"]')).toBeVisible();
            expect(page.url()).toBe(host + '/');
        });

        test("Try to login with empty fileds", async () => {
            // Arrange
            await page.goto(host);
            await page.click('//a[@href="/login"]');
            await page.waitForSelector("form");

            // Act
            const dialogPromise = page.waitForEvent('dialog');
            await page.click('input[type="submit"]');

            const dialog = await dialogPromise;

            // Assert
            expect(dialog.message()).toBe("Unable to log in!");
            await dialog.accept();
            expect(page.url()).toBe(host + "/login");
        });

        test("Logout from the aplication", async () => {
            // Arrange
            await page.goto(host);
            await page.click('//a[@href="/login"]');
            await page.waitForSelector("form");

            
            await page.fill('input[name="email"]', user.email);
            await page.fill('input[name="password"]', user.password);
            await page.click('input[type="submit"]');

            // Act
            await expect(page.locator('//a[@href="/logout"]')).toBeVisible();
            await page.click('//a[@href="/logout"]');

            // Assert
            await expect(page.locator('//a[text()="Login"]')).toBeVisible();
            expect(page.url()).toBe(host + '/');
        });
    });

    describe("Navbar test", () => {
        test("Loged-in users should see the correct buttons in the navbar", async () => {
            // Arrange
            await page.goto(host);
            await page.click('//a[@href="/login"]');
            await page.waitForSelector("form");
 
            // Act
            await page.fill('input[name="email"]', user.email);
            await page.fill('input[name="password"]', user.password);
            await page.click('input[type="submit"]');
            
            // Assert
            await expect(page.locator('//a[text()="All games"]')).toBeVisible();
            await expect(page.locator('//a[text()="Create Game"]')).toBeVisible();
            await expect(page.locator('//a[text()="Logout"]')).toBeVisible();
            await expect(page.locator('//a[text()="Login"]')).toBeHidden();
            await expect(page.locator('//a[text()="Register"]')).toBeHidden();
        });

        test("Guest users should see the correct buttons in the navbar", async () => {
            // Act
            await page.goto(host);

            // Assert
            await expect(page.locator('//a[text()="All games"]')).toBeVisible();
            await expect(page.locator('//a[text()="Login"]')).toBeVisible();
            await expect(page.locator('//a[text()="Register"]')).toBeVisible();
            await expect(page.locator('//a[text()="Create Game"]')).toBeHidden();
            await expect(page.locator('//a[text()="Logout"]')).toBeHidden();
        });
    });

    describe("CRUD operations", () => {
        beforeEach(async () => {
            await page.goto(host);
            await page.click('//a[@href="/login"]');
            await page.waitForSelector('form');
            await page.fill('//input[@name="email"]', user.email);
            await page.fill('//input[@name="password"]', user.password);
            await page.click('input[type="submit"]');
        });

        test("Try to create game with empty fileds", async () => {
            // Act
            await page.click('//a[@href="/create"]');
            await page.waitForSelector('form');

            page.on('dialog', async dialog => {
                expect(dialog.message()).toBe("All fields are required!");
                await dialog.accept();
            })

            await page.click('//input[@type="submit"]');

            // Assert
            expect(page.url()).toBe(host + '/create');
        });

        test("Create a game with valid input", async () => {
            // Arrange
            let random = Math.floor(Math.random() * 1000);
            game.title = `Game Title ${random}`;
            game.category  = `Game category ${random}`;

            await page.click('//a[@href="/create"]');
            await page.waitForSelector('form');

            // Act
            await page.fill('//input[@id="title"]', game.title);
            await page.fill('//input[@id="category"]', game.category);
            await page.fill('//input[@id="maxLevel"]', game.maxLevel);
            await page.fill('//input[@id="imageUrl"]', game.imageUrl);
            await page.fill('//textarea[@id="summary"]', game.summary);

            await page.click('//input[@type="submit"]');

            // Assert
            await expect(page.locator(`//div[@class="game"]//h3[text()="${game.title}"]`)).toBeVisible();
            expect(page.url()).toBe(host + "/");
        });

        test("Check if Edit and Delete buttons are visible for owner", async () => {
            // Arrange
            await page.goto(host + '/catalog');

            // Act
            await page.click(`//div[@class="allGames"]//h2[text()="${game.title}"]//following-sibling::a`);
            game.id = page.url().split('/').pop();

            // Assert
            await expect(page.locator('//a[text()="Edit"]')).toBeVisible();
            await expect(page.locator('//a[text()="Delete"]')).toBeVisible();
        });

        test("Check if Edit and Delete buttons are not visible for non-owner", async () => {
            // Arrange
            await page.goto(host + '/catalog');

            // Act
            await page.click('//div[@class="allGames"]//h2[text()="Zombie Lang"]/parent::div//a');

            // Assert
            await expect(page.locator('//a[text()="Edit"]')).toBeHidden();
            await expect(page.locator('//a[text()="Delete"]')).toBeHidden();
        });

        test("Test that owner can edit game", async () => {
            // Arrange
            await page.goto(host + '/catalog');
            await page.click(`//div[@class="allGames"]//h2[text()="${game.title}"]//following-sibling::a`);
            await page.click('//a[text()="Edit"]');
            await page.waitForSelector('form');
            game.title = `${game.title}_Edited`;

            // Act
            await page.fill('//input[@id="title"]', game.title);
            await page.click('//input[@type="submit"]');

            // Assert
            await expect(page.locator(`//div[@class="game-header"]//h1[text()="${game.title}"]`)).toBeVisible();
            expect(page.url()).toBe(host + `/details/${game.id}`);
        });

        test("Test that owner can delete a game", async () => {
            // Arrange
            await page.goto(host + '/');
            await page.click('//a[@href="/catalog"]');
            await page.click(`//div[@class="allGames"]//h2[text()="${game.title}"]//following-sibling::a`);

            // Act
            await page.click('//a[text()="Delete"]');

            // Assert
            await expect(page.locator(`//div[@class="game"]//h3[text()="${game.title}"]`)).toBeHidden();
            expect(page.url()).toBe(host + '/');
        });
    });

    describe("Home Page tests", () => {
        test("Check if correct data is showing on the Home Page", async () => {
            // Act
            await page.goto(host);

            // Assert
            expect(await page.locator('//div[@class="welcome-message"]//h2')).toHaveText('ALL new games are');
            expect(await page.locator('//div[@class="welcome-message"]//h3')).toHaveText('Only in GamesPlay');
            expect(await page.locator('//div[@id="home-page"]//h1')).toHaveText('Latest Games');

            const gameDivs = await page.locator('//div[@id="home-page"]//div[@class="game"]').all();

            expect(gameDivs.length).toBeGreaterThanOrEqual(3);
        });
    });
});
