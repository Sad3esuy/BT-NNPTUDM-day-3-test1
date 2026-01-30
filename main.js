const API_URL = "https://api.escuelajs.co/api/v1/products";
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
let itemsPerPage = 10;

const productBody = document.getElementById("productBody");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const limitSelect = document.getElementById("limitSelect");
const paginationContainer = document.getElementById("pagination");

// 1. Hàm getall của bảng quản lý
async function getAllProducts() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        allProducts = data;
        filteredProducts = [...allProducts];
        renderUI();
    } catch (error) {
        console.error("Lỗi khi fetch dữ liệu:", error);
        productBody.innerHTML = "<tr><td colspan='6'>Không thể tải dữ liệu sản phẩm.</td></tr>";
    }
}

function renderUI() {
    const sortedData = sortData(filteredProducts);
    const paginatedData = paginateData(sortedData);
    
    displayProducts(paginatedData);
    renderPagination(sortedData.length);
}

// Hàm xử lý và làm sạch tất cả URL hình ảnh từ API
function cleanAllImages(imageArray) {
    const PLACEHOLDER = "https://placehold.co/50x50?text=No+Image";
    if (!imageArray || !Array.isArray(imageArray) || imageArray.length === 0) return [PLACEHOLDER];
    
    let cleanedUrls = [];
    
    imageArray.forEach(img => {
        if (!img) return;
        try {
            // Trường hợp URL bị bọc trong chuỗi JSON mảng: "["http..."]"
            if (typeof img === 'string' && img.startsWith('[') && img.endsWith(']')) {
                const parsed = JSON.parse(img);
                if (Array.isArray(parsed)) {
                    cleanedUrls.push(...parsed);
                } else {
                    cleanedUrls.push(img);
                }
            } else {
                cleanedUrls.push(img);
            }
        } catch (e) {
            cleanedUrls.push(img);
        }
    });

    // Dọn dẹp ký tự thừa và lọc link
    const finalUrls = cleanedUrls
        .map(url => typeof url === 'string' ? url.replace(/[\[\]\"]/g, "").trim() : "")
        .filter(url => url.startsWith("http"));

    return finalUrls.length > 0 ? finalUrls : [PLACEHOLDER];
}

function displayProducts(products) {
    const PLACEHOLDER = "https://placehold.co/50x50?text=No+Image";
    productBody.innerHTML = "";
    if (products.length === 0) {
        productBody.innerHTML = "<tr><td colspan='6' style='text-align:center'>Không tìm thấy sản phẩm nào.</td></tr>";
        return;
    }

    products.forEach(product => {
        const tr = document.createElement("tr");
        const images = cleanAllImages(product.images);
        
        // referrerpolicy="no-referrer" giúp khắc phục lỗi 403 Forbidden từ một số host như Imgur
        const imagesHtml = images.map(src => `
            <img src="${src}" 
                 class="product-img" 
                 alt="${product.title}" 
                 width="50" height="50" 
                 referrerpolicy="no-referrer"
                 onerror="this.onerror=null; this.src='${PLACEHOLDER}';">
        `).join('');

        tr.innerHTML = `
            <td>${product.id}</td>
            <td><div class="img-container">${imagesHtml}</div></td>
            <td>${product.title}</td>
            <td>$${product.price}</td>
            <td>${product.category.name}</td>
            <td><button onclick="console.log('Xem chi tiết', ${product.id})">Chi tiết</button></td>
        `;
        productBody.appendChild(tr);
    });
}

// 2. Thêm tìm kiếm theo title và thay đổi khi onChange (input event)
searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    filteredProducts = allProducts.filter(product => 
        product.title.toLowerCase().includes(searchTerm)
    );
    currentPage = 1; // Reset về trang đầu khi tìm kiếm
    renderUI();
});

// 3. Sắp xếp theo giá và tên
function sortData(data) {
    const sortType = sortSelect.value;
    const sorted = [...data];

    if (sortType === "price-asc") {
        sorted.sort((a, b) => a.price - b.price);
    } else if (sortType === "price-desc") {
        sorted.sort((a, b) => b.price - a.price);
    } else if (sortType === "title-asc") {
        sorted.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortType === "title-desc") {
        sorted.sort((a, b) => b.title.localeCompare(a.title));
    }
    return sorted;
}

sortSelect.addEventListener("change", () => {
    renderUI();
});

// 4. Chia trang cho dữ liệu (5, 10, 20)
limitSelect.addEventListener("change", (e) => {
    itemsPerPage = parseInt(e.target.value);
    currentPage = 1; // Reset về trang đầu khi đổi số lượng hiển thị
    renderUI();
});

function paginateData(data) {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
}

function renderPagination(totalItems) {
    paginationContainer.innerHTML = "";
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    if (totalPages <= 1) return;

    // Nút Trước
    const prevBtn = document.createElement("button");
    prevBtn.innerText = "Trước";
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => {
        currentPage--;
        renderUI();
    };
    paginationContainer.appendChild(prevBtn);

    // Các nút số trang
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement("button");
        btn.innerText = i;
        if (i === currentPage) btn.classList.add("active");
        btn.onclick = () => {
            currentPage = i;
            renderUI();
        };
        paginationContainer.appendChild(btn);
    }

    // Nút Sau
    const nextBtn = document.createElement("button");
    nextBtn.innerText = "Sau";
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => {
        currentPage++;
        renderUI();
    };
    paginationContainer.appendChild(nextBtn);
}

// Khởi chạy
getAllProducts();