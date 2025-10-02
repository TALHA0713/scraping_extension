import { extractRootDomain } from '../contentScript/utils';

interface Captcha {
  domain: string;
  className: string;
}

export const hideExtensionOnCaptcha = (hideExtensionVerification: Captcha[]): boolean => {
  // Check if the current domain matches any in the captchaClasses
  const matchingCaptchaClass = hideExtensionVerification.find((captchaClass) => captchaClass.domain === extractRootDomain(document.URL));

  if (matchingCaptchaClass) {
    // Check for the presence of the reCAPTCHA element
    const captchaElement = document.querySelector(matchingCaptchaClass.className);
    return !!captchaElement;
  }

  return false;
};
