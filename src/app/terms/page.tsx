import LegalPage, { ContactLine } from "@/components/LegalPage";

export const metadata = { title: "Terms of use" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use" updated="November 17, 2026">
      <p>
        Foothill Commons is an independent student project. It is not run by BYU, BYU-Pathway or The Church of Jesus Christ of
        Latter-day Saints. By creating an account you agree to these terms and to the privacy policy.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>Give true information. Students join with a school email, guests join with an invite code, and alumni profiles are checked before they are listed. Guest accounts may be removed after a test.</li>
        <li>One person, one account. Keep your password private and do not let others use your account.</li>
        <li>You must be 18 or older.</li>
      </ul>

      <h2>How to behave</h2>
      <p>Be respectful. You agree not to:</p>
      <ul>
        <li>harass, bully, threaten or discriminate against anyone;</li>
        <li>post sexual, violent, hateful or illegal content, or anything that puts someone in danger;</li>
        <li>share other people&apos;s private information, or pretend to be someone else;</li>
        <li>send spam, advertise, sell things or recruit without permission from an admin;</li>
        <li>upload files you do not have the right to share, or files that contain viruses;</li>
        <li>record or share a call with other people without everyone&apos;s permission;</li>
        <li>try to break, overload or get around the app&apos;s security.</li>
      </ul>

      <h2>Your content</h2>
      <p>
        What you post stays yours. By posting it you let the app show it to the members it is meant for, store it, and send
        it where you chose. Remember that uploaded files can be opened by anyone who has the link.
      </p>

      <h2>Reports and removal</h2>
      <p>
        Members can report posts, comments and messages. Admins may remove content, pause or remove accounts, and reject alumni
        profiles when they think these terms are broken or the community is at risk. Admins decide, and the decision is not
        always explained.
      </p>

      <h2>No guarantees</h2>
      <p>
        The app is provided as it is, by volunteers, and may be slow, change or go offline. Introductions with alumni are
        only introductions: the app does not check advice, jobs or promises made in conversations. To the extent the law
        allows, the people who run the app are not responsible for losses that come from using it.
      </p>

      <h2>Ending your account</h2>
      <p>
        You can stop using the app at any time and ask for your account to be deleted. We can end accounts that break these
        terms.
      </p>

      <h2>Changes and questions</h2>
      <p>
        If these terms change in a way that matters, the date above will change and members will be told in the app. Questions:{" "}
        <ContactLine />.
      </p>
    </LegalPage>
  );
}
