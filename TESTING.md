# Testing the website

This is how to try the site on your own PC with the real MAClub portal behind it. Everything you send goes to
the portal's staging system, not the live one, so nothing is charged for real. Still, please use made-up details
and keep a note of the club codes and names you use, so the test orders can be cleaned up afterwards.

## Getting set up

First, make sure you have the latest code. Open the project folder in a terminal and run:

```
git pull origin main
```

If git says your local changes would be overwritten, don't force it. Just message Jeeven and we'll sort it out
together, otherwise newer work can get lost.

You'll need XAMPP installed, but you don't have to start anything in the XAMPP Control Panel. The site only uses
the PHP that comes with it.

Jeeven will send you a file called `config.php` privately. It holds the portal keys, so please don't share it
or post it anywhere. Put it inside the `api` folder. Git ignores this file, so it will never be uploaded, but you
can double-check with `git status`: `api/config.php` should not appear in the list.

## Starting the site

Double-click `start-local.bat` in the project folder. A black window opens; leave it open while you test.
Then open **http://127.0.0.1:8000** in your browser. (Opening the HTML files directly by double-clicking them
won't work, because the forms can't reach the API that way.)

To check that the site can talk to the portal, open
http://127.0.0.1:8000/api/public.php?action=health. You should see `{"ok":true, ...}`. If you see anything else,
send Jeeven a screenshot of the page and of the black window.

## What to try

**The contact form.** Go to the Contact page and press Send without filling anything in; each field should
show a red message. Then fill it in properly (use "TEST - please ignore" as the name) and send it. You should
get a thank-you message. Sending the exact same message again should still say thanks, but the portal only
keeps one copy.

**Registering a club.** Start from the Pricing page and click Get started on any plan.

- Press Save Club on the empty form. Every required field should be highlighted, including the SSM upload and
  the terms tick box.
- Choose a yearly plan and fill everything in. For now it should ask you to pick the monthly option, because
  yearly plans aren't set up in the portal yet.
- Now do a proper monthly registration with a new club code, something like `TEST` plus your initials and a
  number. After "Club saved!" you should land on the Boost payment page. Check that the amount matches the plan:
  RM100 for Basic, RM150 for Standard, RM200 for Premium.
- Go back and register again with the same club code and email. It should take you to the same payment page
  rather than creating a second order.
- Try a club type the portal doesn't list, like Football. It should still go through to payment.
- Type a made-up promo code and see that you get a message about it.

**After the payment page.** Paying or cancelling on Boost should bring you back to our result page with the
right message. This part depends on a fix from the portal team, so if the result page says it couldn't reach
the D-Clix system, that's expected for now. Just note it down and carry on.

**Language, theme and phone.** Have a quick look at the contact form and the register form in Bahasa Melayu,
in both dark and light theme, and with the browser window made narrow like a phone.

## When you're done

Close the black window to stop the site. Then send Jeeven your notes, with screenshots of anything that looked
wrong, and the list of club codes and names you used. Please don't commit anything from testing; if you changed
a file by accident, `git checkout -- .` puts everything back.
