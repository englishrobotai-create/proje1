import { redirect } from "next/navigation";
import {
  deleteMessageAction,
  markMessageReadAction,
} from "@/app/actions/messages";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function AdminMessagesPage() {
  const session = await getSession();
  if (!session) redirect("/admin/giris");

  const messages = await prisma.message.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <div className="admin-top">
        <h2>İletişim Mesajları</h2>
      </div>
      <div className="admin-panel">
        {messages.length === 0 ? (
          <p style={{ margin: 0 }}>Henüz mesaj yok.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Gönderen</th>
                <th>Mesaj</th>
                <th>Durum</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((message) => (
                <tr key={message.id}>
                  <td>
                    <strong>{message.name}</strong>
                    <div style={{ color: "#7a8795", fontSize: "0.85rem" }}>
                      {message.email}
                      {message.phone ? ` · ${message.phone}` : ""}
                    </div>
                    <div style={{ color: "#7a8795", fontSize: "0.85rem" }}>
                      {message.createdAt.toLocaleString("tr-TR")}
                    </div>
                  </td>
                  <td>
                    {message.subject ? <strong>{message.subject}</strong> : null}
                    <p style={{ margin: message.subject ? "0.35rem 0 0" : 0 }}>
                      {message.body}
                    </p>
                  </td>
                  <td>{message.read ? "Okundu" : "Yeni"}</td>
                  <td>
                    <div className="row-actions">
                      {!message.read ? (
                        <form
                          action={markMessageReadAction.bind(null, message.id)}
                        >
                          <button
                            type="submit"
                            className="btn btn-secondary"
                            style={{ padding: "0.45rem 0.8rem" }}
                          >
                            Okundu
                          </button>
                        </form>
                      ) : null}
                      <form action={deleteMessageAction.bind(null, message.id)}>
                        <button
                          type="submit"
                          className="btn btn-danger"
                          style={{ padding: "0.45rem 0.8rem" }}
                        >
                          Sil
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
