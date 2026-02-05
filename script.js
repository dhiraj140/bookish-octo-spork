// script.js
const SUPABASE_URL = 'https://uzwiriyjowthnaeactuh.supabase.co'; // REPLACE WITH YOUR SUPABASE URL
const SUPABASE_ANON_KEY = 'sb_publishable_Wq26j44XrRXgyV12GghYhQ_1HEwf4vA'; // REPLACE WITH YOUR ANON KEY
const ADMIN_EMAIL = 'dhirajnbachhav@gmail.com'; // REPLACE WITH YOUR ADMIN EMAIL

const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function shuffle(array) {
  let currentIndex = array.length;
  while (currentIndex !== 0) {
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

async function sendOtp(email) {
  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) throw error;
}

async function verifyOtp(email, token) {
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (error) throw error;
  return data.user;
}

async function logout() {
  await supabase.auth.signOut();
  window.location.reload();
}

async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function submitApplication(name, mobile, category) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { error: upsertError } = await supabase.from('users').upsert({
    id: user.id,
    name,
    mobile,
    email: user.email,
    category
  });
  if (upsertError) throw upsertError;

  const { data: existing } = await supabase.from('applications').select('id').eq('user_id', user.id).maybeSingle();
  if (existing) throw new Error('You have already submitted an application');

  const { error: insertError } = await supabase.from('applications').insert({ user_id: user.id, status: 'pending' });
  if (insertError) throw insertError;

  return 'Application submitted successfully!';
}

async function fetchApplications() {
  const { data, error } = await supabase
    .from('applications')
    .select('*, users(name, mobile, category)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

async function startLottery() {
  const { data: statusData } = await supabase.from('lottery_status').select('executed').single();
  if (statusData && statusData.executed) {
    throw new Error('Lottery has already been executed');
  }

  const { data: apps } = await supabase
    .from('applications')
    .select('*, users(name, mobile, category)')
    .eq('status', 'pending');

  if (!apps || apps.length === 0) throw new Error('No pending applications');

  const { data: flatList } = await supabase.from('flats').select('*').eq('status', 'available');
  if (!flatList || flatList.length === 0) throw new Error('No available flats');

  const applicantsByCat = {};
  apps.forEach(app => {
    const cat = app.users.category;
    if (!applicantsByCat[cat]) applicantsByCat[cat] = [];
    applicantsByCat[cat].push(app);
  });

  const flatsByCat = {};
  flatList.forEach(f => {
    if (!flatsByCat[f.category]) flatsByCat[f.category] = [];
    flatsByCat[f.category].push(f);
  });

  const updatePromises = [];

  for (let cat in applicantsByCat) {
    if (flatsByCat[cat] && flatsByCat[cat].length > 0) {
      let applicants = applicantsByCat[cat];
      let availFlats = [...flatsByCat[cat]];
      availFlats.sort((a, b) => a.flat_no.localeCompare(b.flat_no));
      shuffle(applicants);

      const numAllot = Math.min(applicants.length, availFlats.length);

      for (let i = 0; i < numAllot; i++) {
        const app = applicants[i];
        const flat = availFlats[i];

        updatePromises.push(
          supabase.from('applications')
            .update({ flat_id: flat.id, status: 'allotted' })
            .eq('id', app.id)
        );

        updatePromises.push(
          supabase.from('flats')
            .update({ status: 'allotted' })
            .eq('id', flat.id)
        );
      }
    }
  }

  if (updatePromises.length === 0) throw new Error('No allotments possible');

  const results = await Promise.all(updatePromises);
  const errors = results.filter(r => r.error);
  if (errors.length > 0) throw new Error('Some updates failed');

  await supabase.from('lottery_status').update({ executed: true }).eq('id', 1);

  return 'Lottery executed successfully! Flats allotted randomly per category.';
}

async function fetchWinners() {
  const { data, error } = await supabase.from('winners').select('*').order('allotted_at', { ascending: false });
  if (error) throw error;
  return data;
}
