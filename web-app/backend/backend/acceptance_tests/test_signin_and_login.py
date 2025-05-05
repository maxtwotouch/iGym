# from django.contrib.staticfiles.testing import StaticLiveServerTestCase
# from selenium import webdriver
# from selenium.webdriver.firefox.options import Options
# from selenium.webdriver.support.ui import WebDriverWait
# from selenium.webdriver.support import expected_conditions as EC
# from selenium.webdriver.common.by import By
# import subprocess
# from django.conf import settings
# import os
# import time
# import unittest

# class SignInAndLogInTest(StaticLiveServerTestCase):
#     @classmethod
#     def setUpClass(cls):
#         super().setUpClass()
        
#         frontend_dir = settings.BASE_DIR.parent / "frontend"
#         env_path = frontend_dir / ".env"

#         # Set environment variable in frontend
#         with open(env_path, "w") as f:
#             f.write(f"VITE_BACKEND_URL={cls.live_server_url}\n")

#         # Start frontend
#         cls.frontend_process = subprocess.Popen(
#             ["npm", "run", "dev"],
#             cwd=str(frontend_dir),
#             env={
#                 **os.environ,
#                 "VITE_BACKEND_URL": cls.live_server_url,
#                 "VITE_ACCESS_TOKEN": "", 
#                 "VITE_REFRESH_TOKEN": "",  
#                 "VITE_USERNAME": "",       
#                 "VITE_USER_TYPE": "",     
#             },
#             stdout=subprocess.PIPE,
#             stderr=subprocess.PIPE,
#         )
        
#         # Give some time for the frontend to start
#         time.sleep(10)

#         # Set up WebDriver (Firefox)
#         options = Options()
#         options.headless = False
        
#         cls.browser = webdriver.Firefox(options=options)
    
#     @classmethod
#     def tearDownClass(cls):
#         # Reset the environment variable in the frontend
#         frontend_dir = settings.BASE_DIR.parent / "frontend"
#         env_path = frontend_dir / ".env"
        
#         with open(env_path, "w") as f:
#             f.write("")

#         cls.browser.quit()
#         cls.frontend_process.terminate()
#         super().tearDownClass()
    
#     def test_sign_in_and_login(self):
#         self.browser.get("http://localhost:5173")

#         # Click register button
#         register_button = WebDriverWait(self.browser, 10).until(
#             EC.element_to_be_clickable((By.NAME, "registrationButton"))
#         )
#         register_button.click()

#         # Wait for the registration page
#         WebDriverWait(self.browser, 10).until(
#             EC.presence_of_element_located((By.NAME, "username"))
#         )

#         # Fill out the registration page
#         self.browser.find_element(By.NAME, "firstName").send_keys("Test")
#         self.browser.find_element(By.NAME, "lastName").send_keys("User")
#         self.browser.find_element(By.NAME, "username").send_keys("testuser")
#         self.browser.find_element(By.NAME, "password").send_keys("somethingThatIsNotSoEasyToGuess2343")
#         self.browser.find_element(By.NAME, "userType").send_keys("user")
#         self.browser.find_element(By.NAME, "weight").send_keys("70")
#         self.browser.find_element(By.NAME, "height").send_keys("175")

#         # Click submit button on registration page
#         submit_button = WebDriverWait(self.browser, 10).until(
#             EC.element_to_be_clickable((By.NAME, "submitButton"))
#         )
#         submit_button.click()
        
#         time.sleep(5)

#         # Handle alert if present
#         try:
#             WebDriverWait(self.browser, 5).until(EC.alert_is_present())
#             alert = self.browser.switch_to.alert
#             alert.dismiss()
#         except Exception:
#             print("No alert present after registration.")

#         # Wait for login page
#         WebDriverWait(self.browser, 10).until(
#             EC.presence_of_element_located((By.NAME, "username"))
#         )

#         time.sleep(5)

#         # Fill out the login page
#         self.browser.find_element(By.NAME, "username").send_keys("testuser")
#         self.browser.find_element(By.NAME, "password").send_keys("somethingThatIsNotSoEasyToGuess2343")

#         # Click login button
#         login_button = WebDriverWait(self.browser, 10).until(
#             EC.element_to_be_clickable((By.NAME, "loginButton"))
#         )
#         login_button.click()

#         time.sleep(5)

#         print("Successfully logged in and reached dashboard!")

