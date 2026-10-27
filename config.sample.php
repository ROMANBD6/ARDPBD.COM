<?php
// এই ফাইলটা কপি করে নাম দিন config.php । config.php GitHub এ আপলোড হয় না; সেটা শুধু সার্ভারে (আর নিজের কম্পিউটারে) থাকে।
return [
  // ডাটাবেজ: cPanel > MySQL Databases থেকে ডাটাবেজ ও ইউজার বানিয়ে ইউজারকে ডাটাবেজে All Privileges দিন
  'driver' => 'mysql',            // 'sqlite' শুধু নিজের কম্পিউটারে টেস্টের জন্য
  'host'   => 'localhost',
  'name'   => 'your_db_name',
  'user'   => 'your_db_user',
  'pass'   => 'your_db_password',
  'sqlite' => __DIR__.'/data/shop.sqlite',

  // অ্যাডমিন লগইন। প্রথম লগইনের পর পাসওয়ার্ড ডাটাবেজে হ্যাশ হয়ে যায়; তখন এখান থেকে admin_pass মুছে ফেলুন
  'admin_user' => 'adminroman',
  'admin_pass' => '',

  // সাইনআপের কোড: ইমেইল যায় mail() দিয়ে, SMS যায় আপনার SMS সার্ভিসের API দিয়ে
  'mail_from' => 'no-reply@yourdomain.com',
  'sms_url'   => '',              // যেমন: https://sms.example.com/api?key=YOUR_KEY&to={to}&text={msg}   ({to}=নম্বর, {msg}=মেসেজ)
  'dev'       => false,           // শুধু নিজের কম্পিউটারে টেস্টের সময় true করুন (কোড স্ক্রিনে দেখায়)। লাইভ সার্ভারে সবসময় false
];
