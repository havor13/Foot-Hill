import LegalPage, { ContactLine } from "@/components/LegalPage";

export const metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" updated="November 17, 2026">
      <p>
        Foothill Commons is an independent community app for students and alumni. It is not run by BYU, BYU-Pathway or The
        Church of Jesus Christ of Latter-day Saints. This page says what information the app keeps, who can see it, and
        what you can do about it. It is written in plain words on purpose.
      </p>

      <h2>What the app keeps</h2>
      <ul>
        <li>
          <b>Your account:</b> name, email address, a scrambled (hashed) version of your password, and the date you agreed to the
          terms.
        </li>
        <li>
          <b>Your profile:</b> major, hometown, mission, short bio, graduation year and profile photo, if you add them. Alumni
          also give a job title, city, industry, what they can help with and what they are open to.
        </li>
        <li>
          <b>What you do in the app:</b> posts, comments, likes, emoji reactions, group and course memberships, event RSVPs,
          introduction requests, and reports you send.
        </li>
        <li>
          <b>Chats and calls:</b> your messages and files, and when you start or join a call. Calls are not recorded by the app.
        </li>
        <li>
          <b>Files you upload:</b> photos and documents attached to posts, messages and your profile.
        </li>
        <li>
          <b>Your device:</b> a sign-in cookie, a cookie with your time zone, and, only if you turn notifications on, the address
          your browser gives us so we can send them.
        </li>
      </ul>

      <h2>How it is used</h2>
      <p>
        Only to run the app: to sign you in, show your profile and posts to other members, deliver messages and calls, send
        the verification code and notifications you asked for, and let admins review reports and alumni profiles. The app
        has no advertising and does not sell your information.
      </p>

      <h2>Who can see what</h2>
      <ul>
        <li>
          <b>Other members:</b> your name, photo, major and profile details, and anything you post in groups and course circles.
          Signed-in members of the app can see these. People who are not signed in cannot.
        </li>
        <li>
          <b>Chats:</b> only the people in that chat. If someone reports a message, admins can read it.
        </li>
        <li>
          <b>Admins:</b> the people who run the app can see accounts, email addresses, reports, and, because of how the database
          works, any data stored in it. They use this only to run and protect the app.
        </li>
        <li>
          <b>Uploaded files are not private.</b> Anyone who has the link to a file can open it. The links are long and hard to
          guess, but do not upload anything you would not want a stranger to see.
        </li>
      </ul>

      <h2>Services that help run the app</h2>
      <p>The app uses other companies to work. They handle your data only to provide their service:</p>
      <ul>
        <li>Vercel: hosts the website and stores uploaded files.</li>
        <li>Neon: stores the database.</li>
        <li>An email service (Gmail or Resend): sends your verification code.</li>
        <li>LiveKit: carries the audio and video of calls between participants.</li>
        <li>Your browser&apos;s notification service (Google, Apple or Mozilla): delivers notifications if you turn them on.</li>
      </ul>
      <p>These companies may be located in other countries, so your information can be processed outside the country you live in.</p>

      <h2>Cookies</h2>
      <p>
        The app uses only the cookies it needs: one to keep you signed in and one to remember your time zone so event times are
        correct. It does not use advertising or tracking cookies.
      </p>

      <h2>Keeping and deleting your information</h2>
      <p>
        Your information is kept while your account exists. You can delete your account yourself in Settings, under
        &quot;Delete my account&quot;. That removes your profile, posts, comments, reactions, messages, one-to-one chats and
        uploaded files. Copies in routine backups of our service providers can last a little longer. To ask for a copy of what the
        app holds about you, or if you cannot sign in, contact <ContactLine />. You can also change your profile, remove your
        photo and turn notifications off in Settings.
      </p>

      <h2>Safety</h2>
      <p>
        Passwords are stored in scrambled form and the site uses secure connections. Chats are not end-to-end encrypted. No
        online service is perfectly secure, so keep your password private and do not share sensitive details in chats or posts.
      </p>

      <h2>Who it is for</h2>
      <p>Foothill Commons is meant for people 18 and older who are students or alumni.</p>

      <h2>Changes and questions</h2>
      <p>
        If this policy changes in a way that matters, the date at the top will change and members will be told in the app.
        Questions: <ContactLine />.
      </p>
    </LegalPage>
  );
}
