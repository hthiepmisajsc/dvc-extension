'use strict';


(function () {
    const mappingHs01aProperty = [
        { misa: "BudgetSourcePropertyCode", dvc: "maNguonNs" },
        { misa: "BudgetKindItemCode", dvc: "maNganhKt" },
        { misa: "ProjectCode", dvc: "maCtmtDa" },
        { misa: "Col1", dvc: "dtNamTruocChuyenSang" },
        { misa: "Col2", dvc: "dtGiaoDauNam" },
        { misa: "Col3", dvc: "dtKyTrongNam" },
        { misa: "Col4", dvc: "dtLuyKeKyBcTrongNam" },
        { misa: "Col6", dvc: "dtKyDaSd" },
        { misa: "Col7", dvc: "dtSoDuKyBcDaSd" },
        { misa: "Col8", dvc: "dtKyDaCkc" },
        { misa: "Col9", dvc: "dtSoDuKyBcCkc" },
        { misa: "Col10", dvc: "dtGiuLai" },
    ]

    const mappingHs02aProperty = [
        { misa: "Description", dvc: "noiDung" },
        { misa: "BudgetSourcePropertyCode", dvc: "maNguonNsNsnn" },
        { misa: "BudgetKindItemCode", dvc: "maNganhKtNsnn" },
        { misa: "BudgetSubItemCode", dvc: "maNdktNsnn" },
        { misa: "ProjectCode", dvc: "maCtmtDaNsnn" },
        { misa: "Col1", dvc: "phatSinhKyTamUng" },
        { misa: "Col2", dvc: "soDuKyBcTamUng" },
        { misa: "Col3", dvc: "phatSinhKyThucChi" },
        { misa: "Col4", dvc: "soDuKyBcThucChi" }
    ]

    //Định nghĩa nhận dạng selector nút insert row => Nếu dvc thay đổi thì đổi ở đây
    const selectorInsertRow = 'a img:not([title="Xóa"])'
    const selectorDeleteRow = 'a img[title="Xóa"]'

    function initForm(documentWrapperName, bodyDocumentName, mapping) {
        const popup = document.querySelector(`ngb-modal-window[role="dialog"] ${documentWrapperName}`)

        if (popup) {
            const footer = popup.querySelector('[class="modal-footer"]')
            const btnUpload = document.createElement("input")
            btnUpload.className = "btn btn-primary"
            btnUpload.id = "btnMisaImport"
            btnUpload.setAttribute('type', 'button')
            btnUpload.setAttribute('value', 'Nhập khẩu')
            btnUpload.setAttribute('title', 'Nhập khẩu dữ liệu đối chiếu')
            let btnWrapper = footer
            if (footer.querySelector('span')) {
                btnWrapper = footer.querySelector('span')
            }
            btnWrapper.prepend(btnUpload)

            btnUpload.addEventListener('click', () => msUpload_Click(popup, bodyDocumentName, mapping))
        }
    }

    function msUpload_Click(popup, bodyDocumentName, mapping) {
        const input = document.createElement("input");
        const tableBody = popup.querySelector(`[formarrayname="${bodyDocumentName}"]`)
        input.type = "file";
        input.onchange = () => {
            // you can use this method to get file and perform respective operations
            let files = Array.from(input.files);
            var reader = new FileReader();
            reader.onload = (e) => {
                try {
                    //Khởi tạo worker để xử lý
                    var port = chrome.runtime.connect({ name: "misadvc" });
                    let documents = JSON.parse(e.target.result);
                    if (documents && documents.length > 0) {
                        //Delete old row
                        const deleteRow = [...tableBody.querySelectorAll(selectorDeleteRow)]
                        let deleteRowIndex = 0
                        deleteRow.filter(r => {
                            setTimeout(() => {
                                r.click()
                                deleteRowIndex++
                                if (deleteRowIndex === deleteRow.length) {
                                    //thông báo xoá xong
                                    port.postMessage({ type: "deleteOldFinish" });
                                }
                            }, 0)
                        })

                        //Bắt sự kiện worker tiến hành nhâpj liệu
                        port.onMessage.addListener(function (msg) {
                            if (msg) {
                                switch (msg.type) {
                                    case "insert":
                                        //Get row 
                                        const rows = [...tableBody.querySelectorAll('tr')].filter(r => r.querySelector('td[scope="row"]'))
                                        mapping.filter(p => {
                                            if (rows[msg.index]) {
                                                const inputEl = rows[msg.index].querySelector(`input[formcontrolname="${p.dvc}"]`)
                                                if (inputEl && documents[msg.index] && documents[msg.index][p.misa]) {
                                                    inputEl.value = documents[msg.index][p.misa]
                                                }
                                                var event = new Event('input', {
                                                    bubbles: true,
                                                    cancelable: true,
                                                });

                                                inputEl.dispatchEvent(event);
                                            }
                                        })
                                        break;
                                    case "deleteOldFinish":
                                        //Insert rows
                                        for (let i = 0; i < documents.length; i++) {
                                            setTimeout(() => {
                                                if (tableBody.querySelectorAll(selectorInsertRow) && tableBody.querySelectorAll(selectorInsertRow).length > 0) {
                                                    tableBody.querySelectorAll(selectorInsertRow)[0].click()

                                                    //Post vào worker để xử lý
                                                    port.postMessage({ type: "insert", index: i });
                                                }
                                            }, 0)
                                        }
                                        break;
                                }
                            }
                        });
                    }

                } catch (error) {
                    console.log(error)
                }
            };
            reader.readAsText(files[0]);
        };
        input.click();
    }

    window.addEventListener('load', function () {
        var dom_observer = new MutationObserver((mutations) => {
            if (mutations.length > 0) {
                let openModal = false;
                mutations.filter((mutation) => {
                    if (mutation && mutation.attributeName === 'class') {
                        if (mutation.target.classList.contains('modal-open')) {
                            openModal = true
                        }
                    }
                })
                if (openModal) {
                    const btnImport = document.querySelector('input[id="btnMisaImport"]')
                    if (!btnImport) {
                        initForm('app-dcsd-mau-01a', 'dcsdHoso01aGts', mappingHs01aProperty)

                        initForm('app-dcsd-mau-02a', 'dcsdHoso02aGts', mappingHs02aProperty)
                    }
                }
            }
        });

        var container = document.body;
        console.log(container);
        var config = { attributes: true, childList: false, characterData: false };
        dom_observer.observe(container, config);
    });
})();