import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import ffmpeg from "fluent-ffmpeg";
import { v4 as uuidv4 } from "uuid";
import type { Element } from "webdriverio";

type SwipeSpeed = "fast" | "medium" | "slow";
type SwipeLength = "short" | "medium" | "long";
type SwipeDirection = "up" | "down" | "left" | "right";
type Handedness = "left" | "right" | "neutral";

export class EnhancedActionsService {
  private is_screen_recording = false;

  constructor(private web_driver: WebdriverIO.Browser) {}

  /**
   * Checks if an element is currently visible and displayed within the viewport.
   * Uses WebDriverIO's built-in isDisplayed method with withinViewport option.
   * @param element The element to check visibility for.
   * @returns true if the element is displayed and visible within viewport, false otherwise.
   */
  async isElementVisible(element: Element): Promise<boolean> {
    try {
      return (await element.getAttribute("visible")) === "true";
    } catch (error) {
      console.warn("Error checking element visibility:", error);
      return false;
    }
  }

  /**
   * Scrolls the element into view using humanlike swipe gestures.
   * Determines the element's position relative to viewport and performs natural swipes.
   * @param element The element to scroll into view.
   * @param alignToTop Whether to align to the top of the viewport (default: true).
   * @param maxAttempts Maximum number of scroll attempts (default: 5).
   * @param speed Speed of swipe gestures (default: "medium").
   * @param handedness User handedness preference (default: "neutral").
   */
  async scrollToElement(
    element: Element,
    alignToTop: boolean = true,
    maxAttempts: number = 5,
    speed: SwipeSpeed = "medium",
    handedness: Handedness = "neutral",
  ): Promise<void> {
    let attempts = 0;

    while (attempts < maxAttempts) {
      const isVisible = await this.isElementVisible(element);
      if (isVisible) {
        console.log(`Element scrolled into view after ${attempts} attempts`);
        return;
      }

      const elementPosition =
        await this.getElementPositionRelativeToViewport(element);

      if (elementPosition === "in-viewport") {
        // Element is in viewport but not visible (might be obscured)
        console.log("Element is in viewport but not visible");
        return;
      }

      const swipeDirection = this.getSwipeDirectionForElement(
        elementPosition,
        alignToTop,
      );
      const swipeLength = this.getOptimalSwipeLength(elementPosition);

      console.log(
        `Attempt ${attempts + 1}: Element is ${elementPosition}, swiping ${swipeDirection}`,
      );

      // Perform humanlike swipe to bring element into view
      await this.swipeScreen(swipeDirection, speed, swipeLength, handedness);

      // Small delay to allow content to settle
      await this.web_driver.pause(200 + Math.random() * 200);

      attempts++;
    }

    console.warn(
      `Could not scroll element into view after ${maxAttempts} attempts`,
    );
  }

  /**
   * Determines the position of an element relative to the current viewport.
   * @param element The element to check position for.
   * @returns Position descriptor: "above", "below", "left", "right", or "in-viewport".
   */
  private async getElementPositionRelativeToViewport(
    element: Element,
  ): Promise<string> {
    try {
      const location = await element.getLocation();
      const size = await element.getSize();
      const windowSize = await this.web_driver.getWindowSize();

      const elementBottom = location.y + size.height;
      const elementRight = location.x + size.width;

      // Check if element is completely above viewport
      if (elementBottom < 0) {
        return "above";
      }

      // Check if element is completely below viewport
      if (location.y > windowSize.height) {
        return "below";
      }

      // Check if element is completely to the left of viewport
      if (elementRight < 0) {
        return "left";
      }

      // Check if element is completely to the right of viewport
      if (location.x > windowSize.width) {
        return "right";
      }

      // Element overlaps with viewport but might not be fully visible
      return "in-viewport";
    } catch (error) {
      console.warn("Error determining element position:", error);
      return "in-viewport";
    }
  }

  /**
   * Determines the optimal swipe direction to bring an element into view.
   * @param elementPosition The element's position relative to viewport.
   * @param alignToTop Whether to align element to top of viewport.
   * @returns The swipe direction needed.
   */
  private getSwipeDirectionForElement(
    elementPosition: string,
    alignToTop: boolean,
  ): SwipeDirection {
    switch (elementPosition) {
      case "above":
        // Element is above viewport, swipe down to bring it into view
        return "down";
      case "below":
        // Element is below viewport, swipe up to bring it into view
        return "up";
      case "left":
        // Element is to the left, swipe right to bring it into view
        return "right";
      case "right":
        // Element is to the right, swipe left to bring it into view
        return "left";
      default:
        // Element is partially in viewport, default scroll direction based on alignment preference
        return alignToTop ? "up" : "down";
    }
  }

  /**
   * Determines optimal swipe length based on element position.
   * Elements further away require longer swipes.
   * @param elementPosition The element's position relative to viewport.
   * @returns The optimal swipe length.
   */
  private getOptimalSwipeLength(elementPosition: string): SwipeLength {
    switch (elementPosition) {
      case "above":
      case "below":
        // Vertical scrolling typically needs medium to long swipes
        return Math.random() > 0.5 ? "medium" : "long";
      case "left":
      case "right":
        // Horizontal scrolling often needs shorter, more precise movements
        return Math.random() > 0.3 ? "short" : "medium";
      default:
        // In-viewport adjustments need subtle movements
        return "short";
    }
  }

  /**
   * Scrolls an element into view within a specific container using humanlike swipes.
   * Useful for scrollable containers, modals, or specific UI components.
   * @param targetElement The element to scroll into view.
   * @param containerElement The container element to scroll within.
   * @param alignToTop Whether to align to the top of the container (default: true).
   * @param maxAttempts Maximum number of scroll attempts (default: 5).
   * @param speed Speed of swipe gestures (default: "medium").
   * @param handedness User handedness preference (default: "neutral").
   */
  async scrollToElementWithinContainer(
    targetElement: Element,
    containerElement: Element,
    alignToTop: boolean = true,
    maxAttempts: number = 5,
    speed: SwipeSpeed = "medium",
    handedness: Handedness = "neutral",
  ): Promise<void> {
    let attempts = 0;

    while (attempts < maxAttempts) {
      const isVisible = await this.isElementVisible(targetElement);
      if (isVisible) {
        console.log(
          `Element scrolled into view within container after ${attempts} attempts`,
        );
        return;
      }

      const elementPosition = await this.getElementPositionRelativeToContainer(
        targetElement,
        containerElement,
      );

      if (elementPosition === "in-container") {
        // Element is in container but not visible (might be obscured)
        console.log("Element is in container but not visible");
        return;
      }

      const swipeDirection = this.getSwipeDirectionForElement(
        elementPosition,
        alignToTop,
      );
      const swipeLength = this.getOptimalSwipeLength(elementPosition);

      console.log(
        `Attempt ${attempts + 1}: Element is ${elementPosition} relative to container, swiping ${swipeDirection}`,
      );

      // Perform humanlike swipe within the container
      await this.swipeWithinElement(
        containerElement,
        swipeDirection,
        speed,
        swipeLength,
        handedness,
        false,
      );

      // Small delay to allow content to settle
      await this.web_driver.pause(200 + Math.random() * 200);

      attempts++;
    }

    console.warn(
      `Could not scroll element into view within container after ${maxAttempts} attempts`,
    );
  }

  /**
   * Determines the position of an element relative to a container element.
   * @param targetElement The element to check position for.
   * @param containerElement The container element.
   * @returns Position descriptor: "above", "below", "left", "right", or "in-container".
   */
  private async getElementPositionRelativeToContainer(
    targetElement: Element,
    containerElement: Element,
  ): Promise<string> {
    try {
      const targetLocation = await targetElement.getLocation();
      const targetSize = await targetElement.getSize();
      const containerLocation = await containerElement.getLocation();
      const containerSize = await containerElement.getSize();

      const targetBottom = targetLocation.y + targetSize.height;
      const targetRight = targetLocation.x + targetSize.width;
      const containerBottom = containerLocation.y + containerSize.height;
      const containerRight = containerLocation.x + containerSize.width;

      // Check if element is completely above container
      if (targetBottom < containerLocation.y) {
        return "above";
      }

      // Check if element is completely below container
      if (targetLocation.y > containerBottom) {
        return "below";
      }

      // Check if element is completely to the left of container
      if (targetRight < containerLocation.x) {
        return "left";
      }

      // Check if element is completely to the right of container
      if (targetLocation.x > containerRight) {
        return "right";
      }

      // Element overlaps with container but might not be fully visible
      return "in-container";
    } catch (error) {
      console.warn(
        "Error determining element position relative to container:",
        error,
      );
      return "in-container";
    }
  }

  /**
   * Ensures an element is visible before performing an action on it.
   * Scrolls to the element if it's not currently visible.
   * @param element The element to ensure visibility for.
   * @param alignToTop Whether to align to the top of the viewport when scrolling.
   */
  async ensureElementVisible(
    element: Element,
    alignToTop: boolean = true,
  ): Promise<void> {
    const isVisible = await this.isElementVisible(element);
    if (!isVisible) {
      console.log("Element not visible, scrolling into view...");
      await this.scrollToElement(element, alignToTop);
    }
  }

  /**
   * Taps a random point within the bounds of the given element.
   * Uses absolute coordinates with browser.tap().
   * Automatically scrolls to the element if it's not visible.
   * @param element The element to tap on.
   * @param ensureVisible Whether to scroll to element if not visible (default: true).
   */
  async tapRandomPointInElement(
    element: Element,
    ensureVisible: boolean = true,
  ): Promise<void> {
    // Ensure element is visible before interacting with it
    if (ensureVisible) {
      await this.ensureElementVisible(element);
    }

    const size = await element.getSize();
    const location = await element.getLocation();

    const padding = 5;
    const usableWidth = size.width - padding * 2;
    const usableHeight = size.height - padding * 2;

    if (usableWidth <= 0 || usableHeight <= 0) {
      console.warn("Element too small for random tap, using center point");
      await element.click();
      return;
    }

    // Calculate random point within the element bounds (with padding)
    const randomX =
      location.x + padding + Math.floor(Math.random() * usableWidth);
    const randomY =
      location.y + padding + Math.floor(Math.random() * usableHeight);

    await this.web_driver.tap({ x: randomX, y: randomY });
  }

  /**
   * Taps a random point above the given element with handedness bias.
   * Useful for closing slide-up modals, sheets, or overlays by tapping in the area above them.
   * The tap location is biased towards the user's dominant hand for more natural interaction.
   * @param element The element to tap above.
   * @param handedness User handedness preference (left, right, neutral) - default: "neutral".
   * @param verticalOffset Distance above the element to tap (default: 50px).
   * @param ensureVisible Whether to scroll to element if not visible (default: true).
   */
  async tapRandomPointAboveElement(
    element: Element,
    handedness: Handedness = "neutral",
    verticalOffset: number = 50,
    ensureVisible: boolean = true,
  ): Promise<void> {
    // Ensure element is visible before interacting with it
    if (ensureVisible) {
      await this.ensureElementVisible(element);
    }

    const size = await element.getSize();
    const location = await element.getLocation();
    const windowSize = await this.web_driver.getWindowSize();

    // Calculate the area above the element
    const elementCenterX = location.x + size.width / 2;
    const tapAreaTop = Math.max(10, location.y - verticalOffset - 50); // Ensure we don't go too close to screen edge
    const tapAreaBottom = Math.max(tapAreaTop + 20, location.y - 10); // Ensure minimum tap area height

    // If there's not enough space above the element, warn and use available space
    if (tapAreaBottom <= tapAreaTop) {
      console.warn(
        "Not enough space above element for tap, using minimal available space",
      );
      // Use whatever space is available, even if minimal
    }

    // Calculate horizontal position with handedness bias
    let tapX = elementCenterX;
    const maxHorizontalBias = Math.min(
      size.width * 0.4,
      windowSize.width * 0.2,
    ); // Limit bias to reasonable bounds

    switch (handedness) {
      case "right":
        // Right-handed users tend to tap towards the right side
        tapX = elementCenterX + Math.random() * maxHorizontalBias;
        break;
      case "left":
        // Left-handed users tend to tap towards the left side
        tapX = elementCenterX - Math.random() * maxHorizontalBias;
        break;
      case "neutral":
        // Neutral handedness uses center area with small random variation
        tapX =
          elementCenterX + (Math.random() - 0.5) * (maxHorizontalBias * 0.5);
        break;
    }

    // Calculate vertical position within the tap area above the element
    const tapAreaHeight = Math.max(1, tapAreaBottom - tapAreaTop);
    const tapY = tapAreaTop + Math.random() * tapAreaHeight;

    // Ensure tap coordinates stay within screen bounds
    const finalTapX = Math.max(10, Math.min(windowSize.width - 10, tapX));
    const finalTapY = Math.max(10, Math.min(windowSize.height - 10, tapY));

    console.log(
      `Tapping above element at (${Math.round(finalTapX)}, ${Math.round(finalTapY)}) with ${handedness} handedness bias`,
    );

    await this.web_driver.tap({
      x: Math.round(finalTapX),
      y: Math.round(finalTapY),
    });
  }

  /**
   * Gets duration in milliseconds based on speed setting.
   */
  private getSwipeDuration(speed: SwipeSpeed): number {
    switch (speed) {
      case "fast":
        return 50 + Math.random() * 50; // 50-100ms
      case "medium":
        return 100 + Math.random() * 100; // 100-200ms
      case "slow":
        return 200 + Math.random() * 200; // 200-400ms
    }
  }

  /**
   * Gets swipe distance multiplier based on length setting.
   */
  private getSwipeDistanceMultiplier(length: SwipeLength): number {
    switch (length) {
      case "short":
        return 0.2 + Math.random() * 0.15; // 20-35% of available space
      case "medium":
        return 0.4 + Math.random() * 0.2; // 40-60% of available space
      case "long":
        return 0.7 + Math.random() * 0.25; // 70-95% of available space
    }
  }

  /**
   * Calculates starting position based on handedness preference.
   * Right-handed users typically swipe from the right side, left-handed from the left.
   */
  private getHandedStartPosition(
    centerX: number,
    centerY: number,
    windowWidth: number,
    windowHeight: number,
    handedness: Handedness,
  ): { x: number; y: number } {
    let startX = centerX;
    let startY = centerY;

    const horizontalBias = windowWidth * 0.35; // 35% bias from center
    const verticalVariation = Math.min(windowHeight * 0.25, 100); // Random vertical variation

    switch (handedness) {
      case "right":
        // Right-handed users tend to swipe from the right side
        startX = centerX + horizontalBias + Math.random() * 30;
        break;
      case "left":
        // Left-handed users tend to swipe from the left side
        startX = centerX - horizontalBias - Math.random() * 30;
        break;
      case "neutral":
        // Neutral stays near center with small variation
        startX = centerX + (Math.random() - 0.5) * 50;
        break;
    }

    // Add some vertical variation to make it more natural
    startY = centerY + (Math.random() - 0.5) * verticalVariation;

    // Ensure starting position stays within reasonable bounds
    startX = Math.max(50, Math.min(windowWidth - 50, startX));
    startY = Math.max(50, Math.min(windowHeight - 50, startY));

    return { x: startX, y: startY };
  }

  /**
   * Calculates starting position within an element based on handedness preference.
   */
  private getHandedStartPositionInElement(
    centerX: number,
    centerY: number,
    elementWidth: number,
    elementHeight: number,
    handedness: Handedness,
  ): { x: number; y: number } {
    let startX = centerX;
    let startY = centerY;

    const horizontalBias = elementWidth * 0.35; // 35% bias from center within element
    const maxVariation = Math.min(elementWidth * 0.1, 30); // Limit variation to element size

    switch (handedness) {
      case "right":
        // Right-handed users tend to swipe from the right side
        startX = centerX + horizontalBias * 0.5 + Math.random() * maxVariation;
        break;
      case "left":
        // Left-handed users tend to swipe from the left side
        startX = centerX - horizontalBias * 0.5 - Math.random() * maxVariation;
        break;
      case "neutral":
        // Neutral stays near center with small variation
        startX = centerX + (Math.random() - 0.5) * maxVariation;
        break;
    }

    // Add some vertical variation to make it more natural
    const verticalVariation = Math.min(elementHeight * 0.25, 100);
    startY = centerY + (Math.random() - 0.5) * verticalVariation;

    return { x: startX, y: startY };
  }

  /**
   * Performs a realistic swipe across the screen in the specified direction.
   * Simulates natural swipe gestures like scrolling through social media feeds.
   * @param direction The direction to swipe
   * @param speed Speed of the swipe (fast, medium, slow)
   * @param length Length of the swipe (short, medium, long)
   * @param handedness User handedness preference (left, right, neutral)
   */
  async swipeScreen(
    direction: SwipeDirection,
    speed: SwipeSpeed = "medium",
    length: SwipeLength = "medium",
    handedness: Handedness = "neutral",
  ): Promise<void> {
    const windowSize = await this.web_driver.getWindowSize();
    const centerX = Math.floor(windowSize.width / 2);
    const centerY = Math.floor(windowSize.height / 2);

    // Calculate starting position based on handedness preference
    const { x: startX, y: startY } = this.getHandedStartPosition(
      centerX,
      centerY,
      windowSize.width,
      windowSize.height,
      handedness,
    );

    const distanceMultiplier = this.getSwipeDistanceMultiplier(length);
    const duration = this.getSwipeDuration(speed);

    let endX = startX;
    let endY = startY;

    switch (direction) {
      case "up": {
        // Calculate available space from start position to top edge
        const availableUpSpace = startY - 10; // 10px padding from edge
        endY = startY - availableUpSpace * distanceMultiplier;
        // Add slight horizontal drift to avoid perfectly vertical swipes
        endX = startX + (Math.random() - 0.5) * 40;
        break;
      }
      case "down": {
        // Calculate available space from start position to bottom edge
        const availableDownSpace = windowSize.height - 10 - startY; // 10px padding from edge
        endY = startY + availableDownSpace * distanceMultiplier;
        // Add slight horizontal drift to avoid perfectly vertical swipes
        endX = startX + (Math.random() - 0.5) * 40;
        break;
      }
      case "left": {
        // Calculate available space from start position to left edge
        const availableLeftSpace = startX - 10; // 10px padding from edge
        endX = startX - availableLeftSpace * distanceMultiplier;
        // Add slight vertical drift to avoid perfectly horizontal swipes
        endY = startY + (Math.random() - 0.5) * 40;
        break;
      }
      case "right": {
        // Calculate available space from start position to right edge
        const availableRightSpace = windowSize.width - 10 - startX; // 10px padding from edge
        endX = startX + availableRightSpace * distanceMultiplier;
        // Add slight vertical drift to avoid perfectly horizontal swipes
        endY = startY + (Math.random() - 0.5) * 40;
        break;
      }
    }

    // Ensure coordinates stay within screen bounds
    endX = Math.max(10, Math.min(windowSize.width - 10, endX));
    endY = Math.max(10, Math.min(windowSize.height - 10, endY));

    await this.web_driver.swipe({
      from: { x: Math.round(startX), y: Math.round(startY) },
      to: { x: Math.round(endX), y: Math.round(endY) },
      duration: Math.round(duration),
    });
  }

  /**
   * Performs a realistic swipe within the bounds of a specific element.
   * Useful for scrolling within containers, carousels, or specific UI components.
   * Automatically scrolls to the element if it's not visible.
   * @param element The element to swipe within
   * @param direction The direction to swipe
   * @param speed Speed of the swipe (fast, medium, slow)
   * @param length Length of the swipe (short, medium, long)
   * @param handedness User handedness preference (left, right, neutral)
   * @param ensureVisible Whether to scroll to element if not visible (default: true)
   */
  async swipeWithinElement(
    element: Element,
    direction: SwipeDirection,
    speed: SwipeSpeed = "medium",
    length: SwipeLength = "medium",
    handedness: Handedness = "neutral",
    ensureVisible: boolean = true,
  ): Promise<void> {
    // Ensure element is visible before interacting with it
    if (ensureVisible) {
      await this.ensureElementVisible(element);
    }

    const size = await element.getSize();
    const location = await element.getLocation();

    const padding = 10; // Padding to avoid edge issues
    const usableWidth = size.width - padding * 2;
    const usableHeight = size.height - padding * 2;

    if (usableWidth <= 20 || usableHeight <= 20) {
      console.warn("Element too small for swipe gesture");
      return;
    }

    const centerX = location.x + size.width / 2;
    const centerY = location.y + size.height / 2;

    // Calculate starting position based on handedness preference within the element
    const { x: startX, y: startY } = this.getHandedStartPositionInElement(
      centerX,
      centerY,
      size.width,
      size.height,
      handedness,
    );

    const distanceMultiplier = this.getSwipeDistanceMultiplier(length);
    const duration = this.getSwipeDuration(speed);

    let endX = startX;
    let endY = startY;

    switch (direction) {
      case "up": {
        // Calculate available space from start position to top edge of element
        const availableUpSpace = startY - (location.y + padding);
        endY = startY - availableUpSpace * distanceMultiplier;
        // Add slight horizontal drift to avoid perfectly vertical swipes
        endX = startX + (Math.random() - 0.5) * Math.min(usableWidth * 0.1, 20);
        break;
      }
      case "down": {
        // Calculate available space from start position to bottom edge of element
        const availableDownSpace = location.y + size.height - padding - startY;
        endY = startY + availableDownSpace * distanceMultiplier;
        // Add slight horizontal drift to avoid perfectly vertical swipes
        endX = startX + (Math.random() - 0.5) * Math.min(usableWidth * 0.1, 20);
        break;
      }
      case "left": {
        // Calculate available space from start position to left edge of element
        const availableLeftSpace = startX - (location.x + padding);
        endX = startX - availableLeftSpace * distanceMultiplier;
        // Add slight vertical drift to avoid perfectly horizontal swipes
        endY =
          startY + (Math.random() - 0.5) * Math.min(usableHeight * 0.1, 20);
        break;
      }
      case "right": {
        // Calculate available space from start position to right edge of element
        const availableRightSpace = location.x + size.width - padding - startX;
        endX = startX + availableRightSpace * distanceMultiplier;
        // Add slight vertical drift to avoid perfectly horizontal swipes
        endY =
          startY + (Math.random() - 0.5) * Math.min(usableHeight * 0.1, 20);
        break;
      }
    }

    // Ensure coordinates stay within element bounds
    endX = Math.max(
      location.x + padding,
      Math.min(location.x + size.width - padding, endX),
    );
    endY = Math.max(
      location.y + padding,
      Math.min(location.y + size.height - padding, endY),
    );

    await this.web_driver.swipe({
      from: { x: Math.round(startX), y: Math.round(startY) },
      to: { x: Math.round(endX), y: Math.round(endY) },
      duration: Math.round(duration),
    });
  }

  /**
   * Performs a swipe that starts from a specific element and extends beyond it.
   * Useful for dismissing modals, closing drawers, or swiping notifications away.
   * The swipe begins within the element's bounds and continues in the specified direction
   * across the screen, simulating gestures like "swipe to close".
   * @param element The element to start the swipe from
   * @param direction The direction to swipe
   * @param speed Speed of the swipe (fast, medium, slow)
   * @param length Length of the swipe beyond the element (short, medium, long)
   * @param handedness User handedness preference (left, right, neutral)
   * @param ensureVisible Whether to scroll to element if not visible (default: true)
   */
  async swipeStartingFromElement(
    element: Element,
    direction: SwipeDirection,
    speed: SwipeSpeed = "medium",
    length: SwipeLength = "medium",
    handedness: Handedness = "neutral",
    ensureVisible: boolean = true,
  ): Promise<void> {
    // Ensure element is visible before interacting with it
    if (ensureVisible) {
      await this.ensureElementVisible(element);
    }

    const size = await element.getSize();
    const location = await element.getLocation();
    const windowSize = await this.web_driver.getWindowSize();

    const padding = 5; // Small padding to stay within element
    const usableWidth = size.width - padding * 2;
    const usableHeight = size.height - padding * 2;

    if (usableWidth <= 10 || usableHeight <= 10) {
      console.warn("Element too small for swipe gesture");
      return;
    }

    const centerX = location.x + size.width / 2;
    const centerY = location.y + size.height / 2;

    // Calculate starting position within the element based on handedness preference
    const { x: startX, y: startY } = this.getHandedStartPositionInElement(
      centerX,
      centerY,
      size.width,
      size.height,
      handedness,
    );

    // Ensure starting position is within element bounds
    const constrainedStartX = Math.max(
      location.x + padding,
      Math.min(location.x + size.width - padding, startX),
    );
    const constrainedStartY = Math.max(
      location.y + padding,
      Math.min(location.y + size.height - padding, startY),
    );

    const distanceMultiplier = this.getSwipeDistanceMultiplier(length);
    const duration = this.getSwipeDuration(speed);

    let endX = constrainedStartX;
    let endY = constrainedStartY;

    switch (direction) {
      case "up": {
        // Swipe from element towards the top of the screen
        const availableUpSpace = constrainedStartY - 10; // 10px padding from screen edge
        endY = constrainedStartY - availableUpSpace * distanceMultiplier;
        // Add slight horizontal drift to avoid perfectly vertical swipes
        endX = constrainedStartX + (Math.random() - 0.5) * 40;
        break;
      }
      case "down": {
        // Swipe from element towards the bottom of the screen
        const availableDownSpace = windowSize.height - 10 - constrainedStartY;
        endY = constrainedStartY + availableDownSpace * distanceMultiplier;
        // Add slight horizontal drift to avoid perfectly vertical swipes
        endX = constrainedStartX + (Math.random() - 0.5) * 40;
        break;
      }
      case "left": {
        // Swipe from element towards the left edge of the screen
        const availableLeftSpace = constrainedStartX - 10; // 10px padding from screen edge
        endX = constrainedStartX - availableLeftSpace * distanceMultiplier;
        // Add slight vertical drift to avoid perfectly horizontal swipes
        endY = constrainedStartY + (Math.random() - 0.5) * 40;
        break;
      }
      case "right": {
        // Swipe from element towards the right edge of the screen
        const availableRightSpace = windowSize.width - 10 - constrainedStartX;
        endX = constrainedStartX + availableRightSpace * distanceMultiplier;
        // Add slight vertical drift to avoid perfectly horizontal swipes
        endY = constrainedStartY + (Math.random() - 0.5) * 40;
        break;
      }
    }

    // Ensure end coordinates stay within screen bounds
    endX = Math.max(10, Math.min(windowSize.width - 10, endX));
    endY = Math.max(10, Math.min(windowSize.height - 10, endY));

    console.log(
      `Swiping from element at (${Math.round(constrainedStartX)}, ${Math.round(constrainedStartY)}) to (${Math.round(endX)}, ${Math.round(endY)}) in direction: ${direction}`,
    );

    await this.web_driver.swipe({
      from: {
        x: Math.round(constrainedStartX),
        y: Math.round(constrainedStartY),
      },
      to: { x: Math.round(endX), y: Math.round(endY) },
      duration: Math.round(duration),
    });
  }

  async saveScreenshot(): Promise<string> {
    const screenshot = await this.web_driver.takeScreenshot();

    const temp_dir = os.tmpdir();
    const timestamp = Date.now();
    const screenshot_path = path.join(
      temp_dir,
      `instagram-${timestamp}-${uuidv4().substring(0, 8)}.png`,
    );

    const screenshotBuffer = Buffer.from(screenshot, "base64");
    await fs.writeFile(screenshot_path, screenshotBuffer);

    return screenshot_path;
  }

  async startScreenRecording(): Promise<void> {
    if (this.is_screen_recording) {
      console.warn(
        "[EnhancedActionsService]: Screen recording already started",
      );
      return;
    }

    this.is_screen_recording = true;

    await this.web_driver.startRecordingScreen();
  }

  /**
   * Saves the screen recording to a temporary directory and returns the path.
   * @returns Promise<string> Path to the saved recording
   */
  async saveScreenRecording(): Promise<string> {
    if (!this.is_screen_recording) {
      throw new Error("[EnhancedActionsService]: Screen recording not started");
    }

    this.is_screen_recording = false;

    const temp_dir = os.tmpdir();
    const timestamp = Date.now();
    const recording_path = path.join(
      temp_dir,
      `instagram-${timestamp}-${uuidv4().substring(0, 8)}.mp4`,
    );

    const recordingBase64 = await this.web_driver.stopRecordingScreen();
    const recordingBuffer = Buffer.from(recordingBase64, "base64");

    await fs.writeFile(recording_path, recordingBuffer);

    const reencoded_recording_path = recording_path.replace(
      ".mp4",
      "-reencoded.mp4",
    );

    await new Promise((resolve, reject) => {
      ffmpeg(recording_path)
        .videoCodec("libx264")
        .outputOptions([
          "-pix_fmt yuv420p", // ensures compatibility
          "-preset fast", // speed/quality tradeoff
          "-crf 23", // good balance of size/quality
          "-movflags +faststart", // streaming/Google friendly
        ])
        .on("end", () => resolve(reencoded_recording_path))
        .on("error", reject)
        .save(reencoded_recording_path);
    });

    return reencoded_recording_path;
  }
}
