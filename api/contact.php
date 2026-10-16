<?php
/*
 * Home page "Fill in your details" form.
 * Saves the enquiry as a sales lead (Admin → Leads, source "Contact form"),
 * alerts the sales inbox and sends the visitor a short confirmation.
 */
require __DIR__ . '/lib/init.php';
require_method('POST');
throttle('contact:' . client_ip(), 10, 3600);

$in = body();
$f = ['name' => str_in($in, 'name', 120), 'phone' => str_in($in, 'phone', 30), 'email' => strtolower(str_in($in, 'email', 190)),
      'club' => str_in($in, 'club', 120), 'inquiries' => str_in($in, 'inquiries', 2000)];
if (str_in($in, 'website', 100) !== '') json_out(['ok' => true]); // hidden field only bots fill in

$errors = [];
if ($f['name'] === '') $errors['name'] = 'Please enter your name.';
if (!preg_match('/^\+?[0-9 \-]{7,20}$/', $f['phone'])) $errors['phone'] = 'Please enter a valid phone number.';
if (!valid_email($f['email'])) $errors['email'] = 'Please enter a valid email address.';
if ($f['club'] === '') $errors['club'] = 'Please enter your club name.';
if ($f['inquiries'] === '') $errors['inquiries'] = 'Please tell us how we can help.';
if ($errors) fail('Please fix the highlighted fields.', 422, ['fields' => $errors]);

$id = next_id('leads', 'LD');
$lead = ['id' => $id, 'createdAt' => date('c'), 'source' => 'Contact form', 'status' => 'New', 'clubName' => $f['club'], 'clubCode' => '', 'contactName' => $f['name'],
    'email' => $f['email'], 'phone' => $f['phone'], 'sport' => '', 'plan' => '', 'planName' => '', 'billing' => '', 'amount' => 0, 'clubId' => '', 'userId' => '',
    'notes' => 'Enquiry: ' . $f['inquiries'], 'followUp' => '', 'assignedTo' => '', 'ip' => client_ip()];
rec_put('leads', $lead, 'website');
audit(null, 'Create', 'leads', $id, 'Contact form enquiry from ' . $f['name'] . ' (' . $f['club'] . ')');

send_mail((string) cfg('mail.sales_to'), 'New enquiry: ' . $f['club'] . ' — ' . $f['name'],
    email_layout('New website enquiry', 'Someone filled in the contact form on the home page.', [['Name', $f['name']], ['Club', $f['club']], ['Phone', $f['phone']], ['Email', $f['email']], ['Enquiry', $f['inquiries']]],
        ['Open in admin', rtrim((string) cfg('site_url'), '/') . '/admin.html#/leads/' . $id]), 'sales_enquiry', $id);
send_mail($f['email'], 'We received your enquiry — D-Clix',
    email_layout('Thanks, ' . $f['name'] . '!', 'We have received your enquiry about <b>' . esc($f['club']) . '</b>. A D-Clix expert will contact you soon, usually within one working day.', [],
        ['See our plans', rtrim((string) cfg('site_url'), '/') . '/pricing.html'], 'Need help sooner? Call us at +603-7804 1412.'), 'client_enquiry', $id);
json_out(['ok' => true]);
