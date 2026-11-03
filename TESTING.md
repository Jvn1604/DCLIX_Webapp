# Testing the website

Hey! Thanks for helping me test this. 🙌

The website is now connected to the real MAClub portal, so when you register a club or send the contact form,
it actually goes to the portal. Don't worry though, it's the portal's **staging** (test) system, so no real money
is taken and nothing reaches real customers. Just please use made-up details, and keep a small note of the club
codes and names you use so I can ask the portal team to clear them out afterwards.

It should take about 30–45 minutes. Go step by step and you'll be fine.

---

## Part 1: Get the latest code

1. Open the project folder (`DCLIX_Webapp`) in File Explorer.
2. Click the address bar at the top, type `cmd` and press **Enter**. A black terminal window opens, already
   inside the project folder.
3. Type this and press **Enter**:
   ```
   git pull origin main
   ```
4. You should see a list of changed files, or "Already up to date". Both are fine.
5. ⚠️ If it says something like *"Your local changes would be overwritten"* or shows a **conflict**, please stop
   here and message me. Don't delete or copy files to make it go away, otherwise we can lose newer work.
   We'll fix it together in two minutes.

## Part 2: Check XAMPP is installed

You only need XAMPP installed. You **don't** have to open the XAMPP Control Panel or press Start on Apache or
MySQL. The site only uses the PHP that comes with XAMPP.

1. Open File Explorer and go to `C:\xampp\php\`.
2. Check there's a file called `php.exe` in there.
   - ✅ Found it: great, go to Part 3.
   - ❌ No `C:\xampp` folder: install XAMPP from https://www.apachefriends.org/ (keep the default folder
     `C:\xampp`), then come back here.

## Part 3: Put the config file in place

I'll send you a file called **`config.php`**. It holds the keys that let our site talk to the portal, so please
treat it like a password: don't forward it, don't upload it anywhere, and don't paste it into WhatsApp groups,
GitHub or AI chats.

1. Save the file I send you (for example to your Downloads folder).
2. Make sure the name is exactly `config.php`. Some apps add things like `config (1).php` or `config.php.txt`.
   If so, rename it back to `config.php`.
   *(Tip: in File Explorer, turn on View → Show → File name extensions so you can see the real name.)*
3. Copy it into the **`api`** folder inside the project, so it sits next to `config.example.php`:
   ```
   DCLIX_Webapp\api\config.php
   ```
4. Don't open or change anything inside it. It's ready to use as it is.
5. Quick safety check: in the terminal from Part 1, type:
   ```
   git status
   ```
   `api/config.php` should **not** appear in the list. Git is set to ignore it, so it can never be uploaded to
   GitHub by accident. If you do see it there, stop and message me.

## Part 4: Start the site

1. In the project folder, double-click **`start-local.bat`**.
2. A black window opens and your browser should open the site by itself. Keep the black window open the whole
   time you're testing; closing it stops the site.
3. If the browser didn't open, go to **http://127.0.0.1:8000** yourself.
4. Always use that address. Don't open the `.html` files by double-clicking them, because then the forms can't
   reach the API and nothing will work.

## Part 5: Check the connection

Open this link in your browser:

**http://127.0.0.1:8000/api/public.php?action=health**

- ✅ You see `{"ok":true, ...}`: the site is talking to the portal. Off you go to Part 6!
- ❌ You see `{"ok":false}` or an error:
  - Check `config.php` is in the `api` folder and named correctly (Part 3).
  - Check your internet is working.
  - If the black window mentions **"SSL certificate problem"**, message me and I'll send you a fixed config.
  - Still stuck? Send me a screenshot of the browser and of the black window.

## Part 6: The tests

Keep a little note as you go, for each test: what you did, what you used (club code / name), and whether it
worked. A screenshot of anything that looks wrong helps me a lot.

### Test A: Contact form

1. Go to **http://127.0.0.1:8000/contact.html**.
2. Press **Send** without typing anything.
   → Every field should show a small red message.
3. Now fill it in properly:
   - Name: `TEST - please ignore`
   - Phone: any number, e.g. `123456789`
   - Email: any made-up email, e.g. `test@example.com`
   - Club name and message: anything you like
4. Press **Send**.
   → You should see a thank-you message.
5. Press **Send** again with exactly the same details.
   → It should still say thanks (the portal keeps only one copy, so that's correct).

### Test B: Registering a club

1. Go to **http://127.0.0.1:8000/pricing.html** and click **Choose Basic** (or Standard / Premium) on any plan.
   You'll land on the Club Registration page with that plan already chosen.
2. **Empty form:** press **Save Club** without typing anything.
   → All the required fields turn red, including the SSM certificate upload and the terms tick box at the bottom.
3. **Yearly plan:** in "Your plan" at the top, choose a **yearly** option, fill in everything and press Save Club.
   → It should ask you to choose the monthly option for now. That's expected: yearly plans aren't set up in the
   portal yet.
4. **A proper registration:** switch back to a **monthly** plan and fill in everything:
   - Club Name: e.g. `Test Club Ali`
   - Registration number: any number
   - SSM certificate: any small PDF, JPG or PNG (under 5 MB)
   - Head Instructor, Club Type, Phone: anything sensible
   - Club Code: something new, like `TEST` + your initials + a number, e.g. `TESTTA01` ✏️ *write this down*
   - Username, Login Email, Password (8+ characters with a capital letter, a small letter and a number)
   - Promo Code: leave it empty for now
   - Tick the terms box
   - Press **Save Club**
   → You'll see "Club saved!" and then the **Boost** payment page opens (the address starts with
   `stage-pay.boostconnect.biz`).
   → Check the amount: **RM100** for Basic, **RM150** for Standard, **RM200** for Premium.
5. **Same club again:** go back to the registration page and register again with the **same club code and email**.
   → It should take you back to the same Boost page instead of creating a new order.
6. **Double click:** register with another new club code, and double-click Save Club quickly.
   → Only one order should be created (just tell me the club code, I'll check in the portal).
7. **Other sport:** register once with Club Type set to **Football**.
   → It should still reach the Boost page.
8. **Promo code:** register once with a made-up promo code like `HELLO123`.
   → Note down what happens: a message about the code, or straight to Boost at the normal price.
   (We don't have real promo codes set up yet, so I just want to see how the portal reacts.)

### Test C: After the payment page

On the Boost page, try paying (it's the test system, so it's not real money) and, in another test, try
cancelling. Both should bring you back to our result page with a matching message.

⚠️ This part needs a fix from the portal team first. If the result page says *"We could not reach the D-Clix
system"*, that's expected for now. Just note it down and carry on.

### Test D: Language, theme and phone size

1. Switch the language to **BM** (top of the page) and repeat Test A step 2 and Test B step 2.
   → The messages should still make sense.
2. Switch between **dark and light** theme (the sun/moon button).
   → Everything should still be easy to read.
3. Make the browser window narrow like a phone (or press **F12** and click the phone icon).
   → The forms should still fit and be easy to use.

## Part 7: When you're done

1. Close the black window to stop the site.
2. Send me:
   - your notes and screenshots
   - the list of **club codes and names** you used (so the test orders can be deleted)
3. Please don't commit or push anything from testing. If you changed a file by accident, run this in the
   terminal to undo it:
   ```
   git checkout -- .
   ```
   (Don't worry, this doesn't touch `config.php`. Keep that file in the `api` folder for next time.)

That's it, thank you so much! 😊 If anything is unclear or weird, just message me. No question is too small.
