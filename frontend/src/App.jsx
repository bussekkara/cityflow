import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8001";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");

  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [loading, setLoading] = useState(false);

  const [activePage, setActivePage] = useState("dashboard");

  const [selectedEmployees, setSelectedEmployees] = useState({});
  const [selectedStatuses, setSelectedStatuses] = useState({});

  const [actionMessage, setActionMessage] = useState("");
  

const [editingUser, setEditingUser] = useState(null);

const [userForm, setUserForm] = useState({
  full_name: "",
  email: "",
  role: "citizen",
  department_id: "",
});

const [userActionMessage, setUserActionMessage] = useState("");
  // Departman formu
  const [showDepartmentForm, setShowDepartmentForm] =
    useState(false);

  const [departmentName, setDepartmentName] =
    useState("");

  const [departmentDescription, setDepartmentDescription] =
    useState("");

  const [editingDepartmentId, setEditingDepartmentId] =
    useState(null);

  // ================================================
  // LOGIN
  // ================================================

  const handleLogin = async (e) => {
    e.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/users/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.detail || "Giriş başarısız."
        );

        setLoading(false);
        return;
      }

      localStorage.setItem(
        "access_token",
        data.access_token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(data)
      );

      setUser(data);
      setActivePage("dashboard");
      setMessage("");

    } catch (error) {
      console.error("Login error:", error);

      setMessage(
        "Sunucuya bağlanılamadı. Backend'in çalıştığından emin ol."
      );
    }

    setLoading(false);
  };

  // ================================================
  // LOGOUT
  // ================================================

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");

    setUser(null);

    setEmail("");
    setPassword("");

    setUsers([]);
    setRequests([]);
    setWorkOrders([]);
    setDepartments([]);

    setActivePage("dashboard");
    setActionMessage("");

    setShowDepartmentForm(false);
    setDepartmentName("");
    setDepartmentDescription("");
    setEditingDepartmentId(null);
  };

  // ================================================
  // KAYITLI USER
  // ================================================

  useEffect(() => {
    const savedUser =
      localStorage.getItem("user");

    const token =
      localStorage.getItem("access_token");

    if (savedUser && token) {
      try {
        const parsedUser =
          JSON.parse(savedUser);

        setUser(parsedUser);

      } catch (error) {
        console.error(
          "Kayıtlı kullanıcı okunamadı:",
          error
        );

        localStorage.removeItem("user");
        localStorage.removeItem(
          "access_token"
        );
      }
    }
  }, []);

  // ================================================
  // TÜM ADMIN VERİLERİNİ ÇEK
  // ================================================

  const loadAdminData = async () => {
    const token =
      localStorage.getItem("access_token");

    if (!token) {
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    };

    try {
      // --------------------------------
      // USERS
      // --------------------------------

      const usersResponse = await fetch(
        `${API_URL}/users/`,
        {
          headers,
        }
      );

      const usersData =
        await usersResponse.json();

      if (
        usersResponse.ok &&
        Array.isArray(usersData)
      ) {
        setUsers(usersData);
      }

      // --------------------------------
      // REQUESTS
      // --------------------------------

      const requestsResponse =
        await fetch(
          `${API_URL}/requests/`,
          {
            headers,
          }
        );

      const requestsData =
        await requestsResponse.json();

      if (
        requestsResponse.ok &&
        Array.isArray(requestsData)
      ) {
        setRequests(requestsData);
      }

      // --------------------------------
      // WORK ORDERS
      // --------------------------------

      const workOrdersResponse =
        await fetch(
          `${API_URL}/work-orders/`,
          {
            headers,
          }
        );

      const workOrdersData =
        await workOrdersResponse.json();

      if (
        workOrdersResponse.ok &&
        Array.isArray(workOrdersData)
      ) {
        setWorkOrders(workOrdersData);
      }

      // --------------------------------
      // DEPARTMENTS
      // --------------------------------

      const departmentsResponse =
        await fetch(
          `${API_URL}/departments/`,
          {
            headers,
          }
        );

      const departmentsData =
        await departmentsResponse.json();

      if (
        departmentsResponse.ok &&
        Array.isArray(departmentsData)
      ) {
        setDepartments(
          departmentsData
        );
      }

    } catch (error) {
      console.error(
        "Admin verileri alınamadı:",
        error
      );
    }
  };

  // ================================================
  // ADMIN VERİLERİNİ OTOMATİK YÜKLE
  // ================================================

  useEffect(() => {
    if (
      !user ||
      user.role !== "admin"
    ) {
      return;
    }

    loadAdminData();
  }, [user]);

  // ================================================
  // BEKLEYEN TALEPLER
  // ================================================

  const pendingRequests =
    requests.filter((request) => {
      const status =
        request.status?.toLowerCase();

      return (
        status === "pending" ||
        status === "new" ||
        status === "open" ||
        status === "beklemede"
      );
    });

  // ================================================
  // AKTİF İŞ EMİRLERİ
  // ================================================

  const activeWorkOrders =
    workOrders.filter(
      (workOrder) => {
        const status =
          workOrder.status?.toLowerCase();

        return (
          status !== "completed" &&
          status !== "cancelled"
        );
      }
    );

  // ================================================
  // ÇALIŞANLAR
  // ================================================

  const employees =
    users.filter(
      (item) =>
        item.role === "employee"
    );

  // ================================================
  // İŞ EMRİ ATAMA
  // ================================================

  const handleAssignWorkOrder =
    async (workOrderId) => {

      const employeeId =
        selectedEmployees[
          workOrderId
        ];

      if (!employeeId) {
        setActionMessage(
          "Lütfen önce bir çalışan seç."
        );

        return;
      }

      const token =
        localStorage.getItem(
          "access_token"
        );

      try {
        const response =
          await fetch(
            `${API_URL}/work-orders/${workOrderId}/assign?user_id=${employeeId}`,
            {
              method: "PUT",
              headers: {
                Authorization:
                  `Bearer ${token}`,
                Accept:
                  "application/json",
              },
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          setActionMessage(
            data.detail ||
              "İş emri atanamadı."
          );

          return;
        }

        setActionMessage(
          `İş Emri #${workOrderId} başarıyla atandı.`
        );

        await loadAdminData();

      } catch (error) {
        console.error(error);

        setActionMessage(
          "İş emri atanırken hata oluştu."
        );
      }
    };

  // ================================================
  // İŞ EMRİ DURUM GÜNCELLE
  // ================================================

  const handleStatusUpdate =
    async (
      workOrderId,
      currentStatus
    ) => {

      const newStatus =
        selectedStatuses[
          workOrderId
        ] || currentStatus;

      if (
        newStatus === currentStatus
      ) {
        setActionMessage(
          "Yeni durum mevcut durumla aynı."
        );

        return;
      }

      const token =
        localStorage.getItem(
          "access_token"
        );

      try {
        const response =
          await fetch(
            `${API_URL}/work-orders/${workOrderId}/status`,
            {
              method: "PUT",
              headers: {
                Authorization:
                  `Bearer ${token}`,
                "Content-Type":
                  "application/json",
                Accept:
                  "application/json",
              },
              body: JSON.stringify({
                status: newStatus,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          setActionMessage(
            data.detail ||
              "İş emri durumu güncellenemedi."
          );

          return;
        }

        setActionMessage(
          `İş Emri #${workOrderId} durumu güncellendi.`
        );

        await loadAdminData();

      } catch (error) {
        console.error(error);

        setActionMessage(
          "Durum güncellenirken hata oluştu."
        );
      }
    };
    // ================================================
// KULLANICI GÜNCELLE
// ================================================

    const handleUpdateUser = async (userId, userData) => {
  const token = localStorage.getItem("access_token");

  if (!token) {
    setUserActionMessage(
      "Oturum bulunamadı. Lütfen tekrar giriş yap."
    );
    return false;
  }

  try {
    const response = await fetch(
      `${API_URL}/users/${userId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          full_name: userData.full_name.trim(),
          email: userData.email.trim(),
          role: userData.role,
          department_id:
            userData.department_id === "" ||
            userData.department_id === null
              ? null
              : Number(userData.department_id),
        }),
      }
    );

    const data = await response.json();

    console.log("UPDATE USER RESPONSE:", response.status, data);

    if (!response.ok) {
      setUserActionMessage(
        typeof data.detail === "string"
          ? data.detail
          : "Kullanıcı güncellenemedi."
      );

      return false;
    }

    setUserActionMessage(
      `"${data.full_name}" kullanıcısı başarıyla güncellendi.`
    );

    await loadAdminData();

    return true;

  } catch (error) {
    console.error(
      "Kullanıcı güncelleme hatası:",
      error
    );

    setUserActionMessage(
      "Kullanıcı güncellenirken bir hata oluştu."
    );

    return false;
  }
};

    



// ================================================
// KULLANICI AKTİF / PASİF
// ================================================

const handleToggleUserStatus = async (userId) => {
  const token = localStorage.getItem("access_token");

  if (!token) {
    setActionMessage(
      "Oturum bulunamadı. Lütfen tekrar giriş yap."
    );
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}/users/${userId}/status`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setActionMessage(
        typeof data.detail === "string"
          ? data.detail
          : "Kullanıcı durumu değiştirilemedi."
      );
      return;
    }

    setActionMessage(
      `"${data.full_name}" kullanıcısı ${
        data.is_active
          ? "aktif"
          : "pasif"
      } hale getirildi.`
    );

    await loadAdminData();

  } catch (error) {
    console.error(
      "Kullanıcı durum güncelleme hatası:",
      error
    );

    setActionMessage(
      "Kullanıcı durumu güncellenirken bir hata oluştu."
    );
  }
};

  // ================================================
  // DEPARTMAN EKLE
  // ================================================

  const handleCreateDepartment =
    async (e) => {

      e.preventDefault();

      setActionMessage("");

      if (
        !departmentName.trim()
      ) {
        setActionMessage(
          "Departman adı zorunludur."
        );

        return;
      }

      const token =
        localStorage.getItem(
          "access_token"
        );

      if (!token) {
        setActionMessage(
          "Oturum bulunamadı. Lütfen tekrar giriş yap."
        );

        return;
      }

      try {
        const response =
          await fetch(
            `${API_URL}/departments/`,
            {
              method: "POST",
              headers: {
                Authorization:
                  `Bearer ${token}`,
                "Content-Type":
                  "application/json",
                Accept:
                  "application/json",
              },
              body: JSON.stringify({
                name:
                  departmentName.trim(),

                description:
                  departmentDescription.trim() ||
                  null,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          setActionMessage(
            data.detail ||
              "Departman oluşturulamadı."
          );

          return;
        }

        setActionMessage(
          `"${departmentName}" departmanı başarıyla oluşturuldu.`
        );

        setDepartmentName("");
        setDepartmentDescription("");

        setShowDepartmentForm(
          false
        );

        await loadAdminData();

      } catch (error) {
        console.error(
          "Departman oluşturma hatası:",
          error
        );

        setActionMessage(
          "Departman oluşturulurken bir hata oluştu."
        );
      }
    };

  // ================================================
  // DEPARTMAN DÜZENLE
  // ================================================

  const handleEditDepartment = (department) => {
    setEditingDepartmentId(department.id);
    setDepartmentName(department.name || "");
    setDepartmentDescription(
      department.description || ""
    );
    setShowDepartmentForm(true);
    setActionMessage("");
  };

  // ================================================
  // DEPARTMAN GÜNCELLE
  // ================================================

  const handleUpdateDepartment = async (e) => {
    e.preventDefault();

    setActionMessage("");

    if (!departmentName.trim()) {
      setActionMessage(
        "Departman adı zorunludur."
      );
      return;
    }

    const token =
      localStorage.getItem("access_token");

    if (!token) {
      setActionMessage(
        "Oturum bulunamadı. Lütfen tekrar giriş yap."
      );
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/departments/${editingDepartmentId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            name: departmentName.trim(),
            description:
              departmentDescription.trim() || null,
          }),
        }
      );

      const data =
        response.status === 204
          ? {}
          : await response.json();

      if (!response.ok) {
        setActionMessage(
          data.detail ||
            "Departman güncellenemedi."
        );
        return;
      }

      setActionMessage(
        `"${departmentName.trim()}" departmanı başarıyla güncellendi.`
      );

      setDepartmentName("");
      setDepartmentDescription("");
      setEditingDepartmentId(null);
      setShowDepartmentForm(false);

      await loadAdminData();
    } catch (error) {
      console.error(
        "Departman güncelleme hatası:",
        error
      );

      setActionMessage(
        "Departman güncellenirken bir hata oluştu."
      );
    }
  };

  // ================================================
  // DEPARTMAN SİL
  // ================================================

  const handleDeleteDepartment = async (department) => {
    const confirmed = window.confirm(
      `"${department.name}" departmanını silmek istediğine emin misin?`
    );

    if (!confirmed) {
      return;
    }

    const token =
      localStorage.getItem("access_token");

    if (!token) {
      setActionMessage(
        "Oturum bulunamadı. Lütfen tekrar giriş yap."
      );
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/departments/${department.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const data =
        response.status === 204
          ? {}
          : await response.json();

      if (!response.ok) {
        setActionMessage(
          data.detail ||
            "Departman silinemedi."
        );
        return;
      }

      setActionMessage(
        `"${department.name}" departmanı başarıyla silindi.`
      );

      if (
        editingDepartmentId ===
        department.id
      ) {
        setEditingDepartmentId(null);
        setDepartmentName("");
        setDepartmentDescription("");
        setShowDepartmentForm(false);
      }

      await loadAdminData();
    } catch (error) {
      console.error(
        "Departman silme hatası:",
        error
      );

      setActionMessage(
        "Departman silinirken bir hata oluştu."
      );
    }
  };

  // ================================================
  // DEPARTMANLAR SAYFASI
  // ================================================

  if (
    user &&
    user.role === "admin" &&
    activePage === "departments"
  ) {

    return (
      <div className="dashboard">

        {/* SIDEBAR */}

        <aside className="sidebar">

          <div className="sidebar-logo">
            🏙️
            <span>
              CityFlow
            </span>
          </div>

          <nav>

            <button
              onClick={() =>
                setActivePage(
                  "dashboard"
                )
              }
            >
              📊 Dashboard
            </button>

            <button
              onClick={() =>
                setActivePage(
                  "users"
                )
              }
            >
              👥 Kullanıcılar
            </button>

            <button
              onClick={() =>
                setActivePage(
                  "requests"
                )
              }
            >
              📋 Talepler
            </button>

            <button
              onClick={() =>
                setActivePage(
                  "work-orders"
                )
              }
            >
              🛠️ İş Emirleri
            </button>

            <button
              onClick={() =>
                setActivePage(
                  "departments"
                )
              }
            >
              🏢 Departmanlar
            </button>

          </nav>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            🚪 Çıkış Yap
          </button>

        </aside>


        {/* MAIN */}

        <main className="dashboard-main">

          <header className="dashboard-header">

            <div>

              <h1>
                Departmanlar
              </h1>

              <p>
                Belediye bünyesindeki departmanlar
              </p>

            </div>


            <div className="user-info">

              <div className="avatar">
                {user.full_name
                  ?.charAt(0)
                  ?.toUpperCase()}
              </div>

              <div>

                <strong>
                  {user.full_name}
                </strong>

                <span>
                  Administrator
                </span>

              </div>

            </div>

          </header>


          {actionMessage && (
            <div className="message">
              {actionMessage}
            </div>
          )}


          <section className="content-card">

            {/* BAŞLIK */}

            <div className="content-header">

              <div>

                <h2>
                  Tüm Departmanlar
                </h2>

                <p>
                  Toplam{" "}
                  {departments.length}{" "}
                  departman
                </p>

              </div>


              <button
                className="primary-button"
                onClick={() => {

                  const nextShow =
                    !showDepartmentForm;

                  setShowDepartmentForm(
                    nextShow
                  );

                  setActionMessage("");
                  setEditingDepartmentId(null);

                  if (!nextShow) {
                    setDepartmentName("");
                    setDepartmentDescription("");
                  } else {
                    setDepartmentName("");
                    setDepartmentDescription("");
                  }

                }}
              >
                {showDepartmentForm
                  ? "İptal"
                  : "+ Yeni Departman"}
              </button>

            </div>


            {/* YENİ DEPARTMAN FORMU */}

            {showDepartmentForm && (

              <form
                onSubmit={
                  editingDepartmentId
                    ? handleUpdateDepartment
                    : handleCreateDepartment
                }
                style={{
                  background:
                    "#f7f9fc",
                  padding:
                    "24px",
                  borderRadius:
                    "14px",
                  marginBottom:
                    "24px",
                }}
              >

                <h3
                  style={{
                    marginTop: 0,
                    marginBottom: "20px",
                    color: "#1f3b7a",
                  }}
                >
                  {editingDepartmentId
                    ? "Departmanı Düzenle"
                    : "Yeni Departman"}
                </h3>

                <div className="form-group">

                  <label>
                    Departman Adı
                  </label>

                  <input
                    type="text"
                    placeholder="Örn. Fen İşleri Müdürlüğü"
                    value={
                      departmentName
                    }
                    onChange={(e) =>
                      setDepartmentName(
                        e.target.value
                      )
                    }
                    required
                  />

                </div>


                <div className="form-group">

                  <label>
                    Açıklama
                  </label>

                  <input
                    type="text"
                    placeholder="Departmanın görev alanı"
                    value={
                      departmentDescription
                    }
                    onChange={(e) =>
                      setDepartmentDescription(
                        e.target.value
                      )
                    }
                  />

                </div>


                <button
                  type="submit"
                  className="primary-button"
                >
                  {editingDepartmentId
                    ? "Değişiklikleri Kaydet"
                    : "Departmanı Kaydet"}
                </button>

                {editingDepartmentId && (
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => {
                      setEditingDepartmentId(null);
                      setDepartmentName("");
                      setDepartmentDescription("");
                      setShowDepartmentForm(false);
                      setActionMessage("");
                    }}
                    style={{
                      marginLeft: "10px",
                      background: "#6b7280",
                    }}
                  >
                    Vazgeç
                  </button>
                )}

              </form>

            )}


            {/* DEPARTMAN LİSTESİ */}

            {departments.length ===
            0 ? (

              <div className="empty-state">

                <span>
                  🏢
                </span>

                <h3>
                  Departman bulunamadı
                </h3>

                <p>
                  Sistemde kayıtlı departman bulunmuyor.
                </p>

              </div>

            ) : (

              <div className="request-list">

                {departments.map(
                  (department) => (

                    <div
                      className="request-item"
                      key={
                        department.id
                      }
                    >

                      <div className="request-icon">
                        🏢
                      </div>


                      <div className="request-info">

                        <h3>
                          {department.name ||
                            department.department_name ||
                            `Departman #${department.id}`}
                        </h3>

                        <p>
                          {department.description ||
                            "Departman bilgisi bulunmuyor."}
                        </p>

                      </div>


                      <div className="request-id">
                        #{department.id}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          marginLeft: "12px",
                        }}
                      >
                        <button
                          type="button"
                          className="primary-button"
                          onClick={() =>
                            handleEditDepartment(
                              department
                            )
                          }
                          style={{
                            padding: "10px 14px",
                            fontSize: "14px",
                          }}
                        >
                          Düzenle
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteDepartment(
                              department
                            )
                          }
                          style={{
                            padding: "10px 14px",
                            border: "none",
                            borderRadius: "10px",
                            background: "#dc2626",
                            color: "#fff",
                            fontWeight: "600",
                            cursor: "pointer",
                            fontSize: "14px",
                          }}
                        >
                          Sil
                        </button>
                      </div>

                    </div>

                  )
                )}

              </div>

            )}

          </section>

        </main>

      </div>
    );
  }

  // ================================================
  // İŞ EMİRLERİ SAYFASI
  // ================================================

  if (
    user &&
    user.role === "admin" &&
    activePage === "work-orders"
  ) {

    return (
      <div className="dashboard">

        <aside className="sidebar">

          <div className="sidebar-logo">
            🏙️
            <span>
              CityFlow
            </span>
          </div>

          <nav>

            <button
              onClick={() =>
                setActivePage(
                  "dashboard"
                )
              }
            >
              📊 Dashboard
            </button>

            <button
              onClick={() =>
                setActivePage(
                  "users"
                )
              }
            >
              👥 Kullanıcılar
            </button>

            <button
              onClick={() =>
                setActivePage(
                  "requests"
                )
              }
            >
              📋 Talepler
            </button>

            <button
              onClick={() =>
                setActivePage(
                  "work-orders"
                )
              }
            >
              🛠️ İş Emirleri
            </button>

            <button
              onClick={() =>
                setActivePage(
                  "departments"
                )
              }
            >
              🏢 Departmanlar
            </button>

          </nav>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            🚪 Çıkış Yap
          </button>

        </aside>


        <main className="dashboard-main">

          <header className="dashboard-header">

            <div>

              <h1>
                İş Emirleri
              </h1>

              <p>
                İş emirlerini yönetin ve çalışanlara atayın.
              </p>

            </div>


            <div className="user-info">

              <div className="avatar">
                {user.full_name
                  ?.charAt(0)
                  ?.toUpperCase()}
              </div>

              <div>

                <strong>
                  {user.full_name}
                </strong>

                <span>
                  Administrator
                </span>

              </div>

            </div>

          </header>


          {actionMessage && (
            <div className="message">
              {actionMessage}
            </div>
          )}


          <section className="content-card">

            <div className="content-header">

              <div>

                <h2>
                  Tüm İş Emirleri
                </h2>

                <p>
                  Toplam{" "}
                  {workOrders.length}{" "}
                  iş emri
                </p>

              </div>

            </div>


            {workOrders.length ===
            0 ? (

              <div className="empty-state">

                <span>
                  🛠️
                </span>

                <h3>
                  Henüz iş emri bulunmuyor
                </h3>

                <p>
                  Sistemde kayıtlı iş emri bulunamadı.
                </p>

              </div>

            ) : (

              <div className="request-list">

                {workOrders
                  .slice()
                  .reverse()
                  .map(
                    (workOrder) => {

                      const assignedEmployee =
                        users.find(
                          (item) =>
                            item.id ===
                            workOrder.assigned_to
                        );

                      return (

                        <div
                          className="request-item work-order-item"
                          key={
                            workOrder.id
                          }
                        >

                          <div className="request-icon">
                            🛠️
                          </div>


                          <div className="request-info">

                            <h3>
                              İş Emri #
                              {workOrder.id}
                            </h3>

                            <p>
                              Talep #
                              {
                                workOrder.request_id
                              }
                            </p>

                            {workOrder.notes && (
                              <p>
                                📝{" "}
                                {
                                  workOrder.notes
                                }
                              </p>
                            )}

                            <p>
                              👷{" "}
                              {assignedEmployee
                                ? assignedEmployee.full_name
                                : "Atanmamış"}
                            </p>

                          </div>


                          {/* DURUM */}

                          <div className="work-order-control">

                            <label>
                              Durum
                            </label>

                            <select
                              value={
                                selectedStatuses[
                                  workOrder.id
                                ] ||
                                workOrder.status ||
                                "assigned"
                              }
                              onChange={(e) =>
                                setSelectedStatuses(
                                  {
                                    ...selectedStatuses,
                                    [workOrder.id]:
                                      e.target.value,
                                  }
                                )
                              }
                            >

                              <option value="assigned">
                                Atandı
                              </option>

                              <option value="in_progress">
                                Devam Ediyor
                              </option>

                              <option value="completed">
                                Tamamlandı
                              </option>

                            </select>


                            <button
                              className="primary-button"
                              onClick={() =>
                                handleStatusUpdate(
                                  workOrder.id,
                                  workOrder.status
                                )
                              }
                            >
                              Durumu Güncelle
                            </button>

                          </div>


                          {/* ÇALIŞAN ATA */}

                          <div className="work-order-control">

                            <label>
                              Çalışan Ata
                            </label>

                            <select
                              value={
                                selectedEmployees[
                                  workOrder.id
                                ] ||
                                workOrder.assigned_to ||
                                ""
                              }
                              onChange={(e) =>
                                setSelectedEmployees(
                                  {
                                    ...selectedEmployees,
                                    [workOrder.id]:
                                      e.target.value,
                                  }
                                )
                              }
                            >

                              <option value="">
                                Çalışan seç
                              </option>

                              {employees.map(
                                (employee) => (

                                  <option
                                    key={
                                      employee.id
                                    }
                                    value={
                                      employee.id
                                    }
                                  >
                                    {
                                      employee.full_name
                                    }
                                  </option>

                                )
                              )}

                            </select>


                            <button
                              className="primary-button"
                              onClick={() =>
                                handleAssignWorkOrder(
                                  workOrder.id
                                )
                              }
                            >
                              Çalışana Ata
                            </button>

                          </div>

                        </div>

                      );

                    }
                  )}

              </div>

            )}

          </section>

        </main>

      </div>
    );
  }

  // ================================================
  // TALEPLER SAYFASI
  // ================================================

  if (
    user &&
    user.role === "admin" &&
    activePage === "requests"
  ) {

    return (
      <div className="dashboard">

        <aside className="sidebar">

          <div className="sidebar-logo">
            🏙️
            <span>
              CityFlow
            </span>
          </div>

          <nav>

            <button
              onClick={() =>
                setActivePage(
                  "dashboard"
                )
              }
            >
              📊 Dashboard
            </button>

            <button
              onClick={() =>
                setActivePage(
                  "users"
                )
              }
            >
              👥 Kullanıcılar
            </button>

            <button
              onClick={() =>
                setActivePage(
                  "requests"
                )
              }
            >
              📋 Talepler
            </button>

            <button
              onClick={() =>
                setActivePage(
                  "work-orders"
                )
              }
            >
              🛠️ İş Emirleri
            </button>

            <button
              onClick={() =>
                setActivePage(
                  "departments"
                )
              }
            >
              🏢 Departmanlar
            </button>

          </nav>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            🚪 Çıkış Yap
          </button>

        </aside>


        <main className="dashboard-main">

          <header className="dashboard-header">

            <div>

              <h1>
                Talepler
              </h1>

              <p>
                Vatandaşlardan gelen hizmet talepleri
              </p>

            </div>


            <div className="user-info">

              <div className="avatar">
                {user.full_name
                  ?.charAt(0)
                  ?.toUpperCase()}
              </div>

              <div>

                <strong>
                  {user.full_name}
                </strong>

                <span>
                  Administrator
                </span>

              </div>

            </div>

          </header>


          <section className="content-card">

            <div className="content-header">

              <div>

                <h2>
                  Tüm Talepler
                </h2>

                <p>
                  Toplam{" "}
                  {requests.length}{" "}
                  talep
                </p>

              </div>

            </div>


            {requests.length ===
            0 ? (

              <div className="empty-state">

                <span>
                  📋
                </span>

                <h3>
                  Henüz talep bulunmuyor
                </h3>

                <p>
                  Sistemde kayıtlı vatandaş talebi bulunamadı.
                </p>

              </div>

            ) : (

              <div className="request-list">

                {requests
                  .slice()
                  .reverse()
                  .map(
                    (request) => (

                      <div
                        className="request-item"
                        key={
                          request.id
                        }
                      >

                        <div className="request-icon">
                          📋
                        </div>


                        <div className="request-info">

                          <h3>
                            {request.title ||
                              "Başlıksız Talep"}
                          </h3>

                          <p>
                            {request.description ||
                              "Açıklama bulunmuyor."}
                          </p>

                        </div>


                        <div className="request-id">
                          #{request.id}
                        </div>

                      </div>

                    )
                  )}

              </div>

            )}

          </section>

        </main>

      </div>
    );
  }

  // ================================================
  // KULLANICILAR SAYFASI
  // ================================================

  if (
    user &&
    user.role === "admin" &&
    activePage === "users"
  ) {

    return (
      <div className="dashboard">

        <aside className="sidebar">

          <div className="sidebar-logo">
            🏙️
            <span>
              CityFlow
            </span>
          </div>

          <nav>

            <button
              onClick={() =>
                setActivePage(
                  "dashboard"
                )
              }
            >
              📊 Dashboard
            </button>

            <button
              onClick={() =>
                setActivePage(
                  "users"
                )
              }
            >
              👥 Kullanıcılar
            </button>

            <button
              onClick={() =>
                setActivePage(
                  "requests"
                )
              }
            >
              📋 Talepler
            </button>

            <button
              onClick={() =>
                setActivePage(
                  "work-orders"
                )
              }
            >
              🛠️ İş Emirleri
            </button>

            <button
              onClick={() =>
                setActivePage(
                  "departments"
                )
              }
            >
              🏢 Departmanlar
            </button>

          </nav>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            🚪 Çıkış Yap
          </button>

        </aside>


        <main className="dashboard-main">

          <header className="dashboard-header">

            <div>

              <h1>
                Kullanıcılar
              </h1>

              <p>
                Sistemde kayıtlı kullanıcılar
              </p>

            </div>


            <div className="user-info">

              <div className="avatar">
                {user.full_name
                  ?.charAt(0)
                  ?.toUpperCase()}
              </div>

              <div>

                <strong>
                  {user.full_name}
                </strong>

                <span>
                  Administrator
                </span>

              </div>

            </div>

          </header>


          <section className="content-card">

            <div className="content-header">

              <div>

                <h2>
                  Tüm Kullanıcılar
                </h2>

                <p>
                  Toplam{" "}
                  {users.length}{" "}
                  kullanıcı
                </p>
                {editingUser && (
  <div className="edit-user-form">

    <div className="edit-user-header">
      <div>
        <h3>Kullanıcıyı Düzenle</h3>
        <p>
          {editingUser.full_name}
        </p>
      </div>

      <button
        type="button"
        className="secondary-button"
        onClick={() => {
          setEditingUser(null);
          setUserActionMessage("");
        }}
      >
        ✕ İptal
      </button>
    </div>

    {userActionMessage && (
      <div className="message">
        {userActionMessage}
      </div>
    )}

    <div className="edit-user-grid">

      <div className="form-group">
        <label>Ad Soyad</label>

        <input
          type="text"
          value={userForm.full_name}
          onChange={(e) =>
            setUserForm({
              ...userForm,
              full_name: e.target.value,
            })
          }
        />
      </div>

      <div className="form-group">
        <label>Email</label>

        <input
          type="email"
          value={userForm.email}
          onChange={(e) =>
            setUserForm({
              ...userForm,
              email: e.target.value,
            })
          }
        />
      </div>

      <div className="form-group">
        <label>Rol</label>

        <select
          value={userForm.role}
          onChange={(e) =>
            setUserForm({
              ...userForm,
              role: e.target.value,
            })
          }
        >
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="employee">Employee</option>
          <option value="citizen">Citizen</option>
        </select>
      </div>

      <div className="form-group">
        <label>Departman ID</label>

        <input
          type="number"
          value={userForm.department_id}
          onChange={(e) =>
            setUserForm({
              ...userForm,
              department_id: e.target.value,
            })
          }
          placeholder="Boş bırakılabilir"
        />
      </div>

    </div>

    <div className="edit-user-actions">

      <button
        type="button"
        className="primary-button"
        onClick={async () => {

          if (!userForm.full_name.trim()) {
            setUserActionMessage(
              "Ad soyad boş bırakılamaz."
            );
            return;
          }

          if (!userForm.email.trim()) {
            setUserActionMessage(
              "Email boş bırakılamaz."
            );
            return;
          }

          const success = await handleUpdateUser(
  editingUser.id,
  {
    full_name: userForm.full_name.trim(),
    email: userForm.email.trim(),
    role: userForm.role,
    department_id:
      userForm.department_id
        ? Number(userForm.department_id)
        : null,
  }
);

if (success) {
  setEditingUser(null);
}

        }}
      >
        💾 Değişiklikleri Kaydet
      </button>

      <button
        type="button"
        className="secondary-button"
        onClick={() => {
          setEditingUser(null);
          setUserActionMessage("");
        }}
      >
        Vazgeç
      </button>

    </div>

  </div>
)}

              </div>

            </div>


            {users.length ===
            0 ? (

              <div className="empty-state">

                <span>
                  👥
                </span>

                <h3>
                  Kullanıcı bulunamadı
                </h3>

                <p>
                  Sistemde kayıtlı kullanıcı bulunmuyor.
                </p>

              </div>

            ) : (

              <div className="request-list">

                {users.map(
                  (item) => (

                    <div
                      className="request-item"
                      key={
                        item.id
                      }
                    >

                      <div className="avatar">
                        {item.full_name
                          ?.charAt(0)
                          ?.toUpperCase()}
                      </div>


                      <div className="request-info">

                        <h3>
                          {
                            item.full_name
                          }
                        </h3>

                        <p>
                          {
                            item.email
                          }
                        </p>

                      </div>


                      <div className="request-id">
                        {
                          item.role
                        }
                      </div>
                      <div
  style={{
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  }}
>
  <button
    className="primary-button"
    onClick={() => {
  setEditingUser(item);

  setUserForm({
    full_name: item.full_name || "",
    email: item.email || "",
    role: item.role || "citizen",
    department_id:
      item.department_id != null
        ? String(item.department_id)
        : "",
  });

  setUserActionMessage("");
}}
  >
    ✏️ Düzenle
  </button>

  {item.id !== user.id && (
    <button
      className="primary-button"
      onClick={() =>
        handleToggleUserStatus(item.id)
      }
    >
      {item.is_active
        ? "🔒 Pasif Yap"
        : "🔓 Aktif Yap"}
    </button>
  )}
</div>


                      <div className="request-id">
                        {item.is_active
                          ? "Aktif"
                          : "Pasif"}
                      </div>

                    </div>

                  )
                )}

              </div>

            )}

          </section>

        </main>

      </div>
    );
  }

  // ================================================
  // DASHBOARD
  // ================================================

  if (
    user &&
    user.role === "admin" &&
    activePage === "dashboard"
  ) {

    return (
      <div className="dashboard">

        <aside className="sidebar">

          <div className="sidebar-logo">
            🏙️
            <span>
              CityFlow
            </span>
          </div>

          <nav>

            <button
              onClick={() =>
                setActivePage(
                  "dashboard"
                )
              }
            >
              📊 Dashboard
            </button>

            <button
              onClick={() =>
                setActivePage(
                  "users"
                )
              }
            >
              👥 Kullanıcılar
            </button>

            <button
              onClick={() =>
                setActivePage(
                  "requests"
                )
              }
            >
              📋 Talepler
            </button>

            <button
              onClick={() =>
                setActivePage(
                  "work-orders"
                )
              }
            >
              🛠️ İş Emirleri
            </button>

            <button
              onClick={() =>
                setActivePage(
                  "departments"
                )
              }
            >
              🏢 Departmanlar
            </button>

          </nav>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            🚪 Çıkış Yap
          </button>

        </aside>


        <main className="dashboard-main">

          <header className="dashboard-header">

            <div>

              <h1>
                Dashboard
              </h1>

              <p>
                CityFlow yönetim paneline hoş geldiniz.
              </p>

            </div>


            <div className="user-info">

              <div className="avatar">
                {user.full_name
                  ?.charAt(0)
                  ?.toUpperCase()}
              </div>

              <div>

                <strong>
                  {user.full_name}
                </strong>

                <span>
                  Administrator
                </span>

              </div>

            </div>

          </header>


          {/* İSTATİSTİKLER */}

          <section className="stats">

            <div className="stat-card">

              <span className="stat-icon">
                👥
              </span>

              <div>

                <p>
                  Toplam Kullanıcı
                </p>

                <h2>
                  {users.length}
                </h2>

              </div>

            </div>


            <div className="stat-card">

              <span className="stat-icon">
                📋
              </span>

              <div>

                <p>
                  Toplam Talep
                </p>

                <h2>
                  {requests.length}
                </h2>

              </div>

            </div>


            <div className="stat-card">

              <span className="stat-icon">
                🛠️
              </span>

              <div>

                <p>
                  Aktif İş Emirleri
                </p>

                <h2>
                  {
                    activeWorkOrders.length
                  }
                </h2>

              </div>

            </div>


            <div className="stat-card">

              <span className="stat-icon">
                ⏳
              </span>

              <div>

                <p>
                  Bekleyen Talepler
                </p>

                <h2>
                  {
                    pendingRequests.length
                  }
                </h2>

              </div>

            </div>

          </section>


          {/* SON TALEPLER */}

          <section className="content-card">

            <div className="content-header">

              <div>

                <h2>
                  Son Talepler
                </h2>

                <p>
                  Sistemdeki vatandaş talepleri
                </p>

              </div>


              <button
                className="primary-button"
                onClick={() =>
                  setActivePage(
                    "requests"
                  )
                }
              >
                Tümünü Gör
              </button>

            </div>


            {requests.length ===
            0 ? (

              <div className="empty-state">

                <span>
                  📋
                </span>

                <h3>
                  Henüz talep bulunmuyor
                </h3>

                <p>
                  Sistemde kayıtlı vatandaş talebi bulunamadı.
                </p>

              </div>

            ) : (

              <div className="request-list">

                {requests
                  .slice()
                  .reverse()
                  .slice(
                    0,
                    5
                  )
                  .map(
                    (request) => (

                      <div
                        className="request-item"
                        key={
                          request.id
                        }
                      >

                        <div className="request-icon">
                          📋
                        </div>


                        <div className="request-info">

                          <h3>
                            {request.title ||
                              "Başlıksız Talep"}
                          </h3>

                          <p>
                            {request.description ||
                              "Açıklama bulunmuyor."}
                          </p>

                        </div>


                        <div className="request-id">
                          #{request.id}
                        </div>

                      </div>

                    )
                  )}

              </div>

            )}

          </section>


          {/* İŞ EMİRLERİ */}

          <section className="content-card">

            <div className="content-header">

              <div>

                <h2>
                  İş Emirleri
                </h2>

                <p>
                  Sistemdeki iş emirlerinin durumu
                </p>

              </div>


              <button
                className="primary-button"
                onClick={() =>
                  setActivePage(
                    "work-orders"
                  )
                }
              >
                Tümünü Gör
              </button>

            </div>


            {workOrders.length ===
            0 ? (

              <div className="empty-state">

                <span>
                  🛠️
                </span>

                <h3>
                  Henüz iş emri bulunmuyor
                </h3>

                <p>
                  Sistemde kayıtlı iş emri bulunamadı.
                </p>

              </div>

            ) : (

              <div className="request-list">

                {workOrders
                  .slice()
                  .reverse()
                  .slice(
                    0,
                    5
                  )
                  .map(
                    (workOrder) => (

                      <div
                        className="request-item"
                        key={
                          workOrder.id
                        }
                      >

                        <div className="request-icon">
                          🛠️
                        </div>


                        <div className="request-info">

                          <h3>
                            İş Emri #
                            {
                              workOrder.id
                            }
                          </h3>

                          <p>
                            Talep #
                            {
                              workOrder.request_id
                            }
                          </p>

                        </div>


                        <div className="request-id">
                          {
                            workOrder.status
                          }
                        </div>

                      </div>

                    )
                  )}

              </div>

            )}

          </section>


          {/* DEPARTMAN ÖZETİ */}

          <section className="content-card">

            <div className="content-header">

              <div>

                <h2>
                  Departmanlar
                </h2>

                <p>
                  Sistemdeki departmanlar
                </p>

              </div>


              <button
                className="primary-button"
                onClick={() =>
                  setActivePage(
                    "departments"
                  )
                }
              >
                Tümünü Gör
              </button>

            </div>


            {departments.length ===
            0 ? (

              <div className="empty-state">

                <span>
                  🏢
                </span>

                <h3>
                  Departman bulunmuyor
                </h3>

                <p>
                  Sistemde kayıtlı departman bulunamadı.
                </p>

              </div>

            ) : (

              <div className="request-list">

                {departments
                  .slice(
                    0,
                    3
                  )
                  .map(
                    (department) => (

                      <div
                        className="request-item"
                        key={
                          department.id
                        }
                      >

                        <div className="request-icon">
                          🏢
                        </div>


                        <div className="request-info">

                          <h3>
                            {
                              department.name
                            }
                          </h3>

                          <p>
                            {
                              department.description ||
                              "Açıklama bulunmuyor."
                            }
                          </p>

                        </div>


                        <div className="request-id">
                          #
                          {
                            department.id
                          }
                        </div>

                      </div>

                    )
                  )}

              </div>

            )}

          </section>

        </main>

      </div>
    );
  }

  // ================================================
  // LOGIN SAYFASI
  // ================================================

  return (
    <div className="login-page">

      <div className="login-card">

        <div className="logo-area">

          <div className="logo-icon">
            🏙️
          </div>

          <h1>
            CityFlow
          </h1>

          <p>
            Belediye Hizmet Yönetim Sistemi
          </p>

        </div>


        <form
          onSubmit={
            handleLogin
          }
        >

          <div className="form-group">

            <label>
              E-posta
            </label>

            <input
              type="email"
              placeholder="E-posta adresiniz"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
              required
            />

          </div>


          <div className="form-group">

            <label>
              Şifre
            </label>

            <input
              type="password"
              placeholder="Şifreniz"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              required
            />

          </div>


          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >

            {loading
              ? "Giriş yapılıyor..."
              : "Giriş Yap"}

          </button>

        </form>


        {message && (
          <div className="message">
            {message}
          </div>
        )}


        <div className="register-area">

          <span>
            Hesabınız yok mu?
          </span>

          <button
            className="register-button"
            type="button"
          >
            Kayıt Ol
          </button>

        </div>

      </div>

    </div>
  );

}
export default App;
