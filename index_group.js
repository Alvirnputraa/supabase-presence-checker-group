import { createClient } from "@supabase/supabase-js";

// ✅ Ambil env dari Railway
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Environment variables SUPABASE_URL / SUPABASE_SERVICE_KEY tidak ditemukan!");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
console.log("🚀 Group Chat Presence Checker Service Started (interval 15s, cutoff 20s, safe timing)");

// Map untuk menyimpan value ping terakhir dan waktu baca
const lastPingMap = new Map();

// ✅ Fungsi update offline untuk user1, user2 & user3 - SAFE timing untuk menghindari false positive
async function setGroupUsersOffline() {
  try {
    const cutoffMs = 20000; // 20 detik
    const now = Date.now();
    // Ambil semua user online di group_chats
    const { data: groups, error } = await supabase
      .from("group_chats")
      .select("id, user1_status, user1_status_ping, user1_id, user2_status, user2_status_ping, user2_id, user3_status, user3_status_ping, user3_id");
    if (error) {
      console.error("❌ Gagal ambil data group_chats:", error);
      return;
    }
    // Cek user1
    for (const g of groups) {
      if (g.user1_status === "online") {
        const lastPing = lastPingMap.get(`user1_${g.id}`);
        if (!lastPing || lastPing.value !== g.user1_status_ping) {
          lastPingMap.set(`user1_${g.id}`, { value: g.user1_status_ping, time: now });
          console.log(`🔄 User1 ping berubah: ${g.user1_status_ping} (GroupChatID: ${g.id})`);
        } else {
          const elapsed = now - lastPing.time;
          if (elapsed > cutoffMs) {
            await supabase
              .from("group_chats")
              .update({
                user1_status: "offline",
                user1_status_ping: `offline@${Date.now()}`
              })
              .eq("id", g.id);
            console.log(`✅ User1 idle >${cutoffMs/1000}s di-set offline: GroupChatID: ${g.id} | UserID: ${g.user1_id}`);
            lastPingMap.delete(`user1_${g.id}`);
          }
        }
      } else {
        lastPingMap.delete(`user1_${g.id}`);
      }
    }
    // Cek user2
    for (const g of groups) {
      if (g.user2_status === "online") {
        const lastPing = lastPingMap.get(`user2_${g.id}`);
        if (!lastPing || lastPing.value !== g.user2_status_ping) {
          lastPingMap.set(`user2_${g.id}`, { value: g.user2_status_ping, time: now });
          console.log(`🔄 User2 ping berubah: ${g.user2_status_ping} (GroupChatID: ${g.id})`);
        } else {
          const elapsed = now - lastPing.time;
          if (elapsed > cutoffMs) {
            await supabase
              .from("group_chats")
              .update({
                user2_status: "offline",
                user2_status_ping: `offline@${Date.now()}`
              })
              .eq("id", g.id);
            console.log(`✅ User2 idle >${cutoffMs/1000}s di-set offline: GroupChatID: ${g.id} | UserID: ${g.user2_id}`);
            lastPingMap.delete(`user2_${g.id}`);
          }
        }
      } else {
        lastPingMap.delete(`user2_${g.id}`);
      }
    }
    // Cek user3
    for (const g of groups) {
      if (g.user3_status === "online") {
        const lastPing = lastPingMap.get(`user3_${g.id}`);
        if (!lastPing || lastPing.value !== g.user3_status_ping) {
          lastPingMap.set(`user3_${g.id}`, { value: g.user3_status_ping, time: now });
          console.log(`🔄 User3 ping berubah: ${g.user3_status_ping} (GroupChatID: ${g.id})`);
        } else {
          const elapsed = now - lastPing.time;
          if (elapsed > cutoffMs) {
            await supabase
              .from("group_chats")
              .update({
                user3_status: "offline",
                user3_status_ping: `offline@${Date.now()}`
              })
              .eq("id", g.id);
            console.log(`✅ User3 idle >${cutoffMs/1000}s di-set offline: GroupChatID: ${g.id} | UserID: ${g.user3_id}`);
            lastPingMap.delete(`user3_${g.id}`);
          }
        }
      } else {
        lastPingMap.delete(`user3_${g.id}`);
      }
    }
  } catch (err) {
    console.error("🔥 Error runtime:", err);
  }
}

// ✅ SAFE: Jalankan setiap 15 detik untuk memberikan waktu lebih cukup
setInterval(setGroupUsersOffline, 15000);
