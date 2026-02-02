import { api } from 'boot/axios'

export const fileApi = {
  async downloadFile(fileId){
    try {
      const response = await api.get(`/file/down/${fileId}`, {
        responseType: 'blob', // [중요] 응답을 바이너리(Blob)로 받음
      });

      // 1. 헤더에서 파일명 추출 (backend에서 Content-Disposition을 보내줬을 때)
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'downloaded_file.pdf'; // 기본값 설정

      if (contentDisposition) {
        // 1. [우선순위] UTF-8 인코딩 방식 (filename*=UTF-8''...) 체크
        // 한글 등 특수문자가 포함된 경우 보통 이 형식을 따릅니다.
        let filenameMatch = contentDisposition.match(/filename\*=utf-8''([^;]+)/i);

        if (filenameMatch && filenameMatch[1]) {
          filename = decodeURIComponent(filenameMatch[1]);
        }
        // 2. [차선책] 일반 방식 (filename="...") 체크
        else {
          filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
          if (filenameMatch && filenameMatch[1]) {
            // 혹시라도 인코딩되어 있을 수 있으니 디코딩 시도
            filename = decodeURIComponent(filenameMatch[1]);
          }
        }
      }

      // 2. Blob URL 생성
      // response.data는 파일 내용(Blob)입니다.
      const url = window.URL.createObjectURL(new Blob([response.data]));

      // 3. 가상의 <a> 태그 생성 및 클릭
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename); // 다운로드될 파일명 설정
      document.body.appendChild(link);
      link.click();

      // 4. 뒷정리 (메모리 해제 및 태그 삭제)
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('파일 다운로드 실패:', error);
      // 에러 처리 (Notify 등)
    }
  }
};
