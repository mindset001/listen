//
//  ListenUITests.swift
//  listen — drives the real app against the live backend (npm run dev must
//  be running) and captures screenshots at each key screen. This is what
//  actually taps through signup, unlike APISmokeTests which calls the
//  networking layer directly.
//

import XCTest

private let waitTimeout: TimeInterval = 20

final class ListenUITests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    func testSignupAndTourApp() throws {
        let app = XCUIApplication()
        app.launch()
        attach(app, name: "01-splash")

        // Splash auto-advances after ~2.2s.
        let emailField = app.textFields["Email"]
        XCTAssertTrue(emailField.waitForExistence(timeout: waitTimeout), "Auth screen did not appear after splash")
        attach(app, name: "02-auth-login")

        app.buttons["Create an account"].tap()

        let nameField = app.textFields["Name"]
        XCTAssertTrue(nameField.waitForExistence(timeout: waitTimeout))
        attach(app, name: "03-auth-signup")

        let email = "uitest-\(Int(Date().timeIntervalSince1970))@example.com"
        nameField.tap()
        nameField.typeText("UI Test")

        emailField.tap()
        emailField.typeText(email)

        let passwordField = app.secureTextFields["Password"]
        XCTAssertTrue(passwordField.waitForExistence(timeout: waitTimeout))
        passwordField.tap()
        passwordField.typeText("password123")

        app.buttons["Create account"].tap()

        // This network has shown real, intermittent latency to MongoDB and
        // other services all session — generous timeouts throughout, not
        // evidence of an app bug.
        let dashboardTab = app.tabBars.buttons["Dashboard"]
        XCTAssertTrue(dashboardTab.waitForExistence(timeout: 60), "Did not land on the dashboard after signup")
        XCTAssertTrue(app.staticTexts["Welcome back, UI Test"].waitForExistence(timeout: waitTimeout))
        attach(app, name: "04-dashboard")

        // iOS shows its native "Save Password?" Keychain prompt after a
        // password-field submission — dismiss it before tapping anything
        // else, or it silently intercepts the next several taps.
        let notNow = app.buttons["Not Now"]
        if notNow.waitForExistence(timeout: 3) {
            notNow.tap()
        }

        // Library (empty state for a fresh account).
        app.tabBars.buttons["Library"].tap()
        XCTAssertTrue(app.staticTexts["Nothing here yet. Your first document goes here."].waitForExistence(timeout: waitTimeout))
        attach(app, name: "05-library-empty")

        // Saved audio.
        app.tabBars.buttons["Saved audio"].tap()
        XCTAssertTrue(app.staticTexts["Saved audio"].waitForExistence(timeout: waitTimeout))
        attach(app, name: "06-saved-audio-empty")

        // Settings — real signed-in identity should be visible.
        app.tabBars.buttons["Settings"].tap()
        XCTAssertTrue(app.staticTexts["UI Test"].waitForExistence(timeout: waitTimeout))
        XCTAssertTrue(app.staticTexts[email].waitForExistence(timeout: waitTimeout))
        attach(app, name: "07-settings")

        // New reading sheet — voices should load from the real API.
        app.tabBars.buttons["Dashboard"].tap()
        app.buttons["New reading"].tap()
        XCTAssertTrue(app.navigationBars["New reading"].waitForExistence(timeout: waitTimeout))
        XCTAssertTrue(app.staticTexts["Nova Premium"].waitForExistence(timeout: waitTimeout), "Real voices from GET /api/voices did not render")
        attach(app, name: "08-new-reading")

        // Leftover test accounts are cleaned up out-of-band via a DB script
        // (see conversation notes) rather than driving the delete-account
        // flow here, to keep this test focused on one thing at a time.
    }

    private func attach(_ app: XCUIApplication, name: String) {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
