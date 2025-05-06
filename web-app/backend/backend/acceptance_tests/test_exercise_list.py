# from django.contrib.staticfiles.testing import StaticLiveServerTestCase
# from selenium import webdriver
# from selenium.webdriver.firefox.options import Options
# import subprocess
# import os
# import time
# from django.core.management import call_command
# from selenium.webdriver.support.ui import WebDriverWait
# from selenium.webdriver.common.by import By
# from selenium.webdriver.support import expected_conditions as EC
# from backend.models import UserProfile
# from django.conf import settings
# from django.contrib.auth.models import User
# from rest_framework_simplejwt.tokens import RefreshToken

# class ExerciseListTest(StaticLiveServerTestCase):
#     @classmethod
#     def setUpClass(cls):
#         super().setUpClass()
        
#         frontend_dir = settings.BASE_DIR.parent / "frontend"
#         env_path = frontend_dir / ".env"
        
#         with open(env_path, "w") as f:
#             f.write(f"VITE_BACKEND_URL={cls.live_server_url}\n")
            
#         cls.frontend_process = subprocess.Popen(
#             ["npm", "run", "dev"],
#             cwd=str(frontend_dir),
#             env={
#                 **os.environ,
#                 "VITE_BACKND_URL": cls.live_server_url,
#                 "VITE_ACCESS_TOKEN": "",
#                 "VITE_REFRESH_TOKEN": "",
#                 "VITE_USERNAME": "",
#                 "VITE_USER_TYPE": "",
#             },
#             stdout=subprocess.PIPE,
#             stderr=subprocess.PIPE,
#         )
        
#         time.sleep(10)
        
#         options = Options()
#         options.headless = False
        
#         cls.browser = webdriver.Firefox(options=options)
        
    
#     @classmethod
#     def tearDownClass(cls):
#         frontend_dir = settings.BASE_DIR.parent / "frontend"
#         env_path = frontend_dir / ".env"
        
#         with open(env_path, "w") as f:
#             f.write("")
            
#         cls.browser.quit()
#         cls.frontend_process.terminate()
#         super().tearDownClass()
    
#     def test_exercise_list(self):
#         call_command("loaddata", "exercises.json")
        
#         self.test_user = User.objects.create_user(username="testuser", password="somethingThatIsNotSoEasyToGuess2343")
#         self.test_profile = UserProfile.objects.create(user=self.test_user, weight=70, height=175)
        
#         refresh = RefreshToken.for_user(self.test_user)
#         self.access_token = str(refresh.access_token)
#         self.refresh_token = str(refresh)
        
#         os.environ["VITE_ACCESS_TOKEN"] = self.access_token
#         os.environ["VITE_REFRESH_TOKEN"] = self.refresh_token
#         os.environ["VITE_USERNAME"] = self.test_user.username
#         os.environ["VITE_USER_TYPE"] = str(self.test_profile.role)
        
#         self.browser.refresh()
#         self.browser.get("http://localhost:5173")
        
#         login_button = WebDriverWait(self.browser, 10).until(
#             EC.element_to_be_clickable((By.NAME, "loginButton"))
#         )
#         login_button.click()
        
#         self.browser.find_element(By.NAME, "username").send_keys("testuser")
#         self.browser.find_element(By.NAME, "password").send_keys("somethingThatIsNotSoEasyToGuess2343")
        
#         login_button = WebDriverWait(self.browser, 10).until(
#             EC.element_to_be_clickable((By.NAME, "loginButton"))
#         )
#         login_button.click()
        
#         time.sleep(5)
        
#         exercise_list_button = WebDriverWait(self.browser, 10).until(
#             EC.element_to_be_clickable((By.CSS_SELECTOR, '[data-name="Exercises"]'))
#         )
        
#         exercise_list_button.click()
#         time.sleep(5)
        
#         exercise_option = self.browser.find_element(By.CSS_SELECTOR, "div[data-id='45']")
#         exercise_option.click()
        
#         time.sleep(5)
        
#         print("Successfully found information about exercise!")