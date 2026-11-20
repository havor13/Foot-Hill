import Link from "next/link";
import LegalPage from "@/components/LegalPage";

export const metadata = { title: "Help" };

const SECTIONS = [
  ["start", "Getting started"],
  ["profile", "Your profile and photo"],
  ["feed", "Home feed and posts"],
  ["groups", "Groups and course circles"],
  ["more", "Events, People and Alumni"],
  ["chat", "Chat"],
  ["calls", "Calls and notifications"],
  ["safety", "Safety and etiquette"],
  ["delete", "Deleting your account"],
  ["trouble", "Troubleshooting"],
] as const;

export default function HelpPage() {
  return (
    <LegalPage title="How to use Foothill Commons" updated="November 20, 2026" wide>
      <p>
        Foothill Commons is a community app for BYU and BYU-Pathway students and alumni: groups, course circles, events,
        a people directory, chat and calls. It works in any modern browser and on a phone.
      </p>
      <nav aria-label="On this page" className="flex flex-wrap gap-2">
        {SECTIONS.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="rounded-full border border-line px-3 py-1 text-sm text-muted hover:bg-surface2">
            {label}
          </a>
        ))}
      </nav>

      <h2 id="start">Getting started</h2>
      <ol className="list-decimal pl-5 [&_li]:mt-1">
        <li>
          Open <Link href="/signup" className="font-semibold text-accent underline">Sign up</Link> and choose{" "}
          <b>Student</b>, <b>Alumni</b> or <b>Guest</b>.
        </li>
        <li>Fill in your name, email and a password of at least 8 characters, and agree to the terms.</li>
        <li>We email you a 6-digit code. Enter it on the next page. Check your Junk folder if it does not arrive.</li>
        <li>You land on the Home feed, already in a few starter groups.</li>
      </ol>
      <p>
        <b>Students</b> sign up with an @byu.edu or @byupathway.edu email. <b>Alumni</b> use any email and add their
        graduation year. An admin reviews each alumni profile before it appears in the directory. <b>Guests</b> are
        invited testers and school leaders without a student email: choose Guest and enter the invite code you were
        given. A guest account may be removed after the test.
      </p>
      <p>
        On a phone, use the bottom menu. To keep the app on your home screen, open the site in your browser and choose
        Add to Home Screen. Use <b>Sign in</b> to come back, and <b>Sign out</b> in Settings.
      </p>

      <h2 id="profile">Your profile and photo</h2>
      <p>
        Open <b>Settings</b> (your name on a computer, <b>Me</b> on a phone).
      </p>
      <ul>
        <li>
          <b>Photo:</b> choose <b>Add a photo</b>, pick a JPG, PNG or WebP picture, and it saves straight away. Use{" "}
          <b>Change photo</b> or <b>Remove</b> later.
        </li>
        <li>
          <b>Details:</b> name, major, hometown, an optional mission and a short About you. Press <b>Save profile</b>.
        </li>
        <li>Your photo and details show on your posts, in the People list and in chats.</li>
      </ul>

      <h2 id="feed">Home feed and posts</h2>
      <p>The Home page shows posts from the groups and course circles you have joined.</p>
      <ul>
        <li>Write in the box at the top, pick where to post it, and press <b>Post</b>. You can attach photos and files.</li>
        <li>Under any post you can react with an emoji, <b>comment</b>, and report it if something is not right.</li>
        <li>Tap a photo to view it larger. Documents open in a new tab, and a download button saves the file.</li>
      </ul>

      <h2 id="groups">Groups and course circles</h2>
      <p>
        <b>Groups</b> are interest and community spaces. Open <b>Groups</b>, pick one and press <b>Join</b>.{" "}
        <b>Course circles</b> give every course its own space for study help, posts, study sessions and a group chat. If your
        course is missing, use <b>Add your course</b> on the Courses page to create it.
      </p>
      <p>
        Inside a group you can post, plan a study session or event, and open the group chat. The person who created a
        course circle, or an admin, can delete it from its page.
      </p>

      <h2 id="more">Events, People and Alumni</h2>
      <p>
        <b>Events</b> lists upcoming events and study sessions. Press <b>RSVP</b> to say you will come, and again to cancel.
        Times are shown in your own time zone, which the app reads from your device.
      </p>
      <p>
        <b>People</b> lists students. Search by name or major and press <b>Message</b> to start a chat.{" "}
        <b>Alumni</b> lists approved alumni with what they can help with. Use the filters, then ask for an introduction.
      </p>

      <h2 id="chat">Chat</h2>
      <ul>
        <li>
          <b>New message:</b> pick a student to start a private chat. <b>New group chat:</b> name it, tick the people, and
          press <b>Create chat</b>. Course and group chats are created automatically.
        </li>
        <li>Press Enter to send. Shift+Enter adds a new line.</li>
        <li>Attach up to 4 photos or files per message, 10 MB each.</li>
        <li>React to a message with an emoji. In private chats, two ticks mean the other person has read it.</li>
        <li>If a message fails to send, press <b>Retry</b>.</li>
      </ul>

      <h2 id="calls">Calls and notifications</h2>
      <p>
        <b>Calls.</b> In any chat, press the phone button (audio) or the camera button (video). Everyone in the chat sees a
        banner and hears a ring, and presses <b>Join</b>. Up to 12 people can be in one call. Allow your microphone and
        camera when your browser asks. Calls are not recorded by the app.
      </p>
      <p>
        <b>Notifications when the app is closed.</b> In <b>Settings</b>, turn on notifications on each device where you want
        them. On an iPhone, first add the site to your Home Screen from Safari and open it from that icon. If they stop,
        check that your browser is allowed to send notifications in your device settings.
      </p>

      <h2 id="safety">Safety and etiquette</h2>
      <ul>
        <li>
          <b>Files are not private.</b> Anyone with the link to a photo or document can open it. Do not upload IDs, financial
          records or passwords.
        </li>
        <li>Be kind and on topic. Never share your password or verification code with anyone.</li>
        <li>
          <b>Report</b> any post, comment or message that is not right. Pick a reason and an admin will review it.
        </li>
        <li>
          Alumni are reviewed before they are listed, but check that an introduction fits your goals before sharing personal
          details.
        </li>
        <li>
          Read the <Link href="/terms" className="font-semibold text-accent underline">Terms of use</Link> and{" "}
          <Link href="/privacy" className="font-semibold text-accent underline">Privacy policy</Link>. This is an independent
          student project, not run by BYU, BYU-Pathway or The Church of Jesus Christ of Latter-day Saints.
        </li>
      </ul>

      <h2 id="delete">Deleting your account</h2>
      <p>
        Open <b>Settings</b>, scroll to the bottom and open <b>Delete my account</b>. Enter your password, type DELETE and
        confirm. Your profile, photo, posts, comments, reactions, messages, private chats and uploaded files are removed
        for good and you are signed out. This cannot be undone.
      </p>

      <h2 id="trouble">Troubleshooting</h2>
      <ul>
        <li>
          <b>No verification email:</b> wait a minute, check Junk or Spam, and try again from the sign-in page.
        </li>
        <li>
          <b>Cannot sign in:</b> check your email and password. If you forgot your password, ask the person who runs the app.
        </li>
        <li>
          <b>No notifications or no call banner:</b> turn notifications on in Settings for this device and allow them in your
          browser. On an iPhone, open the app from the Home Screen icon.
        </li>
        <li>
          <b>A page looks out of date:</b> refresh it. Chats update every few seconds on their own.
        </li>
        <li>
          <b>A photo will not upload:</b> use JPG, PNG or WebP under 10 MB.
        </li>
      </ul>
    </LegalPage>
  );
}
