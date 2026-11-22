export const storeOfficerAccounts = [
  { id: "uniform_c", name: "Ishara Senanayake", initials: "IS", tone: "green", grants: [{ role: "uniform_store", branch: "colombo" }] },
  { id: "uniform_l", name: "Dulani Jayawardena", initials: "DJ", tone: "blue", grants: [{ role: "uniform_store", branch: "lakeside" }] },
];

export function storesSeed() {
  const storeCatalog = [];
  for (const branch of ["colombo", "lakeside"]) {
    for (let grade = 1; grade <= 13; grade++) {
      for (const [subject, art] of [["Mathematics", "math"], ["English", "english"], ["Science", "science"]]) {
        const id = `${branch}-pupil-${grade}-${art}`;
        storeCatalog.push({ id, branch, kind: "books", title: `${subject} Pupil’s Book`, category: subject, grade, art, enabled: true,
          variants: [{ id: id + "-standard", label: "Standard edition", stock: 24 }] });
      }
    }
    for (const [code, title, sizes] of [
      ["shirt", "School shirt", ["6", "8", "10", "12", "14", "16"]],
      ["trousers", "School trousers", ["6", "8", "10", "12", "14", "16"]],
      ["skirt", "School skirt", ["6", "8", "10", "12", "14", "16"]],
      ["sports", "Sports T-shirt", ["XS", "S", "M", "L", "XL"]],
    ]) {
      const id = branch + "-uniform-" + code;
      storeCatalog.push({ id, branch, kind: "uniforms", title, category: "School uniform", grade: null, art: code, enabled: true,
        variants: sizes.map((size) => ({ id: id + "-" + size, label: size, stock: size === "16" ? 4 : 16 })) });
    }
  }
  return { storesVersion: 1, storeCatalog, storeReservations: [], reservationBags: {}, storeReports: [], storeSequence: 0 };
}
