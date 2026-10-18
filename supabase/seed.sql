-- Starter content. Candidates are marked verified as supplied by the admin;
-- add each candidate's official_source_url (the Registrar's notice) in the
-- admin dashboard or via SQL. Election events are inserted UNVERIFIED and stay
-- hidden until an admin confirms each one against its source.

insert into positions (slug, title, description, sort_order) values
  ('president', 'President', 'AMU Students'' Union. Leads the Union and represents students to the administration.', 1),
  ('vice-president', 'Vice-President', 'AMU Students'' Union. Supports the President and leads assigned portfolios.', 2),
  ('honorary-secretary', 'Honorary Secretary', 'AMU Students'' Union. Manages Union records, meetings and communication.', 3),
  ('cabinet-member', 'Cabinet Member', 'AMU Students'' Union. Represents students across Union committees.', 4),
  ('court-agricultural-sciences-theology', 'University Court — Agricultural Sciences & Theology', 'Representative of Students on the University Court.', 10),
  ('court-arts', 'University Court — Arts', 'Representative of Students on the University Court.', 11),
  ('court-commerce', 'University Court — Commerce', 'Representative of Students on the University Court.', 12),
  ('court-engineering-technology', 'University Court — Engineering & Technology', 'Representative of Students on the University Court.', 13),
  ('court-law', 'University Court — Law', 'Representative of Students on the University Court.', 14),
  ('court-life-sciences', 'University Court — Life Sciences', 'Representative of Students on the University Court.', 15),
  ('court-management-international-studies', 'University Court — Management Studies & International Studies', 'Representative of Students on the University Court.', 16),
  ('court-medicine', 'University Court — Medicine', 'Representative of Students on the University Court.', 17),
  ('court-science', 'University Court — Science', 'Representative of Students on the University Court.', 18),
  ('court-social-sciences', 'University Court — Social Sciences', 'Representative of Students on the University Court.', 19),
  ('court-unani-medicine', 'University Court — Unani Medicine', 'Representative of Students on the University Court.', 20)
on conflict (slug) do update
  set title = excluded.title, description = excluded.description, sort_order = excluded.sort_order;

insert into candidates (slug, position_id, ballot_number, name, faculty, verification_status)
select
  trim(both '-' from regexp_replace(lower(c.name), '[^a-z0-9]+', '-', 'g')),
  p.id, c.ballot, c.name, c.faculty, 'verified'
from (values
  ('president', 1, 'Mubashir Husain Shah', null),
  ('president', 2, 'M. Salman Imtiaz', null),
  ('president', 3, 'Mohammad Gajnabi', null),
  ('president', 4, 'Asad Murtaza', null),
  ('president', 5, 'Md. Alauddin', null),

  ('vice-president', 1, 'Yaseen Ghazi', null),
  ('vice-president', 2, 'Sonveer Singh', null),
  ('vice-president', 3, 'Hamza Sufyan', null),
  ('vice-president', 4, 'Zaid Sherwani', null),
  ('vice-president', 5, 'Mohd Arif Khan', null),

  ('honorary-secretary', 1, 'Mohd Sufiyan', null),
  ('honorary-secretary', 2, 'Salman Ahmed', null),
  ('honorary-secretary', 3, 'Huzaifa Amir', null),
  ('honorary-secretary', 4, 'Gufran Ali', null),

  ('cabinet-member', 1, 'Md. Idris', null),
  ('cabinet-member', 2, 'Maryam Batool', null),
  ('cabinet-member', 3, 'Mohd Masood', null),
  ('cabinet-member', 4, 'Ferdaus Ahmed Barbhuiya', null),
  ('cabinet-member', 5, 'Mohd Shoeb', null),
  ('cabinet-member', 6, 'Mohammad Alam', null),
  ('cabinet-member', 7, 'Syed Shahrukh Husain', null),
  ('cabinet-member', 8, 'Gowtham K', null),
  ('cabinet-member', 9, 'Nishant Bhardwaj', null),
  ('cabinet-member', 10, 'Mohammad Arfaat', null),
  ('cabinet-member', 11, 'Musheer Javed', null),
  ('cabinet-member', 12, 'Najmus Saquib', null),
  ('cabinet-member', 13, 'Abdul Khalid', null),
  ('cabinet-member', 14, 'Mohd Asif', null),
  ('cabinet-member', 15, 'Md Affan Yezdani', null),
  ('cabinet-member', 16, 'Faraz Rehan', null),
  ('cabinet-member', 17, 'Mohammad Naeem Ali', null),
  ('cabinet-member', 18, 'Syed Zamin Mehdi Rizvi', null),
  ('cabinet-member', 19, 'Naved Alam', null),
  ('cabinet-member', 20, 'Md. Asif', null),
  ('cabinet-member', 21, 'Fahd Ayub Zinjani', null),
  ('cabinet-member', 22, 'Moin Uddin', null),
  ('cabinet-member', 23, 'Fakhara Khan', null),
  ('cabinet-member', 24, 'Ajmal Husain', null),
  ('cabinet-member', 25, 'Mohd Ovais Khalidi', null),
  ('cabinet-member', 26, 'Krishna Kumar Sharma', null),
  ('cabinet-member', 27, 'Abbas Shamim Siddiqui', null),
  ('cabinet-member', 28, 'Hasan Mustafa', null),

  ('court-agricultural-sciences-theology', 1, 'Kunwar Aboo Turav', 'Agricultural Sciences & Theology'),
  ('court-agricultural-sciences-theology', 2, 'Shafeequr Rahman Khan', 'Agricultural Sciences & Theology'),
  ('court-arts', 1, 'Farrukh Lodi', 'Arts'),
  ('court-arts', 2, 'Abdul Waheed', 'Arts'),
  ('court-arts', 3, 'Mohd Faraz Hasan', 'Arts'),
  ('court-arts', 4, 'M Amir Siddiqui', 'Arts'),
  ('court-commerce', 1, 'Faraz Khan Sherwani', 'Commerce'),
  ('court-commerce', 2, 'Mohd. Bilal Khan', 'Commerce'),
  ('court-engineering-technology', 1, 'Sayem Hussain', 'Engineering & Technology'),
  ('court-engineering-technology', 2, 'Manish Kumar', 'Engineering & Technology'),
  ('court-engineering-technology', 3, 'Syed Mohd. Subhan', 'Engineering & Technology'),
  ('court-engineering-technology', 4, 'Arshe Alam', 'Engineering & Technology'),
  ('court-law', 1, 'Anurag Singh', 'Law'),
  ('court-law', 2, 'Raas Masood Khan', 'Law'),
  ('court-life-sciences', 1, 'Danish Faiz', 'Life Sciences'),
  ('court-life-sciences', 2, 'Mohammad Ghayasuddin', 'Life Sciences'),
  ('court-management-international-studies', 1, 'Sehba Khan', 'Management Studies & International Studies'),
  ('court-management-international-studies', 2, 'Anas Ahmad Khan', 'Management Studies & International Studies'),
  ('court-management-international-studies', 3, 'Md Sadique', 'Management Studies & International Studies'),
  ('court-management-international-studies', 4, 'Nabeel Shakeel', 'Management Studies & International Studies'),
  ('court-medicine', 1, 'Saddam Khan', 'Medicine'),
  ('court-medicine', 2, 'Md. Raashid', 'Medicine'),
  ('court-science', 1, 'Suhail Khan', 'Science'),
  ('court-science', 2, 'Mohd Khalid', 'Science'),
  ('court-science', 3, 'Aman Sharma', 'Science'),
  ('court-social-sciences', 1, 'Salman Ahmad', 'Social Sciences'),
  ('court-social-sciences', 2, 'Shah Fahad Khan', 'Social Sciences'),
  ('court-social-sciences', 3, 'Amirul Jaish', 'Social Sciences'),
  ('court-unani-medicine', 1, 'Fazlurrehman', 'Unani Medicine'),
  ('court-unani-medicine', 2, 'Maaz Ahmad', 'Unani Medicine')
) as c(position_slug, ballot, name, faculty)
join positions p on p.slug = c.position_slug
on conflict (slug) do nothing;

delete from election_events
where title in ('Voter list process begins', 'Polling day');

insert into election_events (title, description, kind, starts_at, source_url, verified_at)
select v.title, v.description, v.kind::election_event_kind, v.starts_at::timestamptz, v.source_url, v.verified_at::timestamptz
from (values
  ('Voter lists displayed at deans'' offices', null, 'milestone', '2026-10-26T10:00:00+05:30', 'https://www.amu.ac.in/', '2026-10-18T12:00:00+05:30'),
  ('Requests for corrections in voter lists', 'Till 2 pm.', 'milestone', '2026-10-27T14:00:00+05:30', 'https://www.amu.ac.in/', '2026-10-18T12:00:00+05:30'),
  ('Final voter list released', null, 'milestone', '2026-10-27T16:00:00+05:30', 'https://www.amu.ac.in/', '2026-10-18T12:00:00+05:30'),
  ('Nominations filed at the AMUSU office', '10 am to 1 pm.', 'milestone', '2026-10-29T10:00:00+05:30', 'https://www.amu.ac.in/', '2026-10-18T12:00:00+05:30'),
  ('Scrutiny of nominations', 'From 4 pm.', 'milestone', '2026-10-29T16:00:00+05:30', 'https://www.amu.ac.in/', '2026-10-18T12:00:00+05:30'),
  ('Withdrawal of nominations', '10 am to 1 pm.', 'milestone', '2026-10-30T10:00:00+05:30', 'https://www.amu.ac.in/', '2026-10-18T12:00:00+05:30'),
  ('List of valid candidates displayed', null, 'milestone', '2026-10-30T16:00:00+05:30', 'https://www.amu.ac.in/', '2026-10-18T12:00:00+05:30'),
  ('Serial numbers allotted; final list published', '10 am and 4 pm.', 'milestone', '2026-10-31T10:00:00+05:30', 'https://www.amu.ac.in/', '2026-10-18T12:00:00+05:30'),
  ('Presidential candidates'' speeches from the Union Hall roof', null, 'milestone', '2026-11-03T14:00:00+05:30', 'https://www.amu.ac.in/', '2026-10-18T12:00:00+05:30'),
  ('Voting in faculties', '9 am to 5 pm. Lunch break from 1 pm to 2 pm.', 'polling', '2026-11-05T09:00:00+05:30', 'https://www.amu.ac.in/', '2026-10-18T12:00:00+05:30'),
  ('Counting begins', '7 pm. Venue to be announced.', 'milestone', '2026-11-05T19:00:00+05:30', 'https://www.amu.ac.in/', '2026-10-18T12:00:00+05:30')
) as v(title, description, kind, starts_at, source_url, verified_at)
where not exists (select 1 from election_events e where e.title = v.title);

insert into issues (slug, title, description, context, category, status, published_at) values
  ('library-hours', 'Should library hours be extended during examinations?',
   'Many students report difficulty finding quiet study space late in the evening during exam weeks.',
   'Consider staffing, security, electricity costs and reading-room capacity.', 'Library', 'published', now()),
  ('hostel-water-supply', 'How should hostel drinking water and supply be improved?',
   'Students in several halls report intermittent water supply and concerns about drinking-water quality.',
   'Includes purifier maintenance, testing frequency and complaint response times.', 'Hostels', 'published', now()),
  ('campus-wifi', 'How will campus Wi-Fi coverage and speed be improved?',
   'Connectivity in halls, libraries and departments affects coursework and online exams.',
   'Consider coverage gaps, bandwidth, login issues and support channels.', 'Infrastructure', 'published', now()),
  ('mess-food-quality', 'What will be done about mess food quality and pricing?',
   'Students raise recurring concerns about hygiene, nutrition and price changes in hall messes.',
   'Includes inspection, feedback mechanisms and transparency of charges.', 'Hostels', 'published', now()),
  ('campus-transport', 'How should transport within campus be improved?',
   'Long distances between halls, faculties and gates make commuting time-consuming.',
   'Consider shuttle routes, e-rickshaw regulation, timings and accessibility.', 'Transport', 'published', now()),
  ('safety-and-lighting', 'How will campus safety and street lighting be improved?',
   'Poorly lit stretches and late-evening safety are recurring concerns, especially for women students.',
   'Consider lighting audits, emergency helplines, patrols and grievance processes.', 'Safety', 'published', now()),
  ('placement-support', 'How should placement and internship support be strengthened?',
   'Students across faculties want more recruiter outreach, training and internship opportunities.',
   'Includes the training and placement office, alumni networks and industry tie-ups.', 'Careers', 'published', now()),
  ('mental-health', 'What mental health and counselling support should be available?',
   'Academic pressure and living away from home make accessible counselling important.',
   'Consider counsellor availability, confidentiality and awareness programmes.', 'Wellbeing', 'published', now()),
  ('exam-results-timeline', 'How can delays in exam results and grievances be reduced?',
   'Delayed results and slow re-evaluation processes affect admissions and job applications.',
   'Consider published timelines, status tracking and grievance redressal.', 'Academics', 'published', now()),
  ('sports-facilities', 'How should sports facilities and access be improved?',
   'Students want better maintained grounds, equipment and fair access to facilities.',
   'Includes booking systems, timings and inclusion of women''s sports.', 'Sports', 'published', now())
on conflict (slug) do nothing;
