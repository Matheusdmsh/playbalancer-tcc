import api from './api';

const MAX_FILE_SIZE_MB = parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE_MB || '5', 10);
const ALLOWED_EXTENSIONS = (process.env.NEXT_PUBLIC_ALLOWED_EXTENSIONS || 'jpg,jpeg,png,gif,webp').split(',');

/**
 * Valida o arquivo de imagem (tipo e tamanho).
 * @param file - O objeto File a ser validado.
 * @throws {Error} se o arquivo for inválido.
 */
function validateImageFile(file: File): void {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  if (!fileExtension || !ALLOWED_EXTENSIONS.includes(fileExtension)) {
    throw new Error(`Tipo de arquivo inválido. Permitidos: ${ALLOWED_EXTENSIONS.join(', ')}`);
  }

  const fileSizeInMB = file.size / 1024 / 1024;
  if (fileSizeInMB > MAX_FILE_SIZE_MB) {
    throw new Error(`O arquivo é muito grande. O tamanho máximo é de ${MAX_FILE_SIZE_MB}MB.`);
  }
}

/**
 * Faz upload da imagem de perfil de um usuário enviando para o backend.
 * @param imageFile - O arquivo de imagem.
 * @param userId - O ID do usuário (enviado por consistência com a API anterior, mas o backend usa o do token).
 * @returns A URL da imagem.
 */
export async function uploadUserImage(imageFile: File, userId: string): Promise<string> {
  validateImageFile(imageFile);
  const formData = new FormData();
  formData.append('file', imageFile);

  try {
    const response = await api.post('/upload/user-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.url;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Falha ao fazer upload da imagem de perfil.');
  }
}

/**
 * Faz upload da imagem de uma turma enviando para o backend.
 * @param imageFile - O arquivo de imagem.
 * @param groupId - O ID da turma.
 * @returns A URL da imagem.
 */
export async function uploadGroupImage(imageFile: File, groupId: string): Promise<string> {
  validateImageFile(imageFile);
  const formData = new FormData();
  formData.append('file', imageFile);

  try {
    const response = await api.post(`/upload/group-photo/${groupId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.url;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Falha ao fazer upload da imagem da turma.');
  }
}

/**
 * Faz upload da imagem de uma arena enviando para o backend.
 * @param imageFile - O arquivo de imagem.
 * @param arenaId - O ID da arena.
 * @returns A URL da imagem.
 */
export async function uploadArenaImage(imageFile: File, arenaId: string): Promise<string> {
  validateImageFile(imageFile);
  const formData = new FormData();
  formData.append('file', imageFile);

  try {
    const response = await api.post(`/upload/arena-photo/${arenaId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.url;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Falha ao fazer upload da imagem da arena.');
  }
}

/**
 * A funcionalidade de deletar pode não ser estritamente necessária pro frontend, mas mantemos interface.
 */
export async function deleteFileByUrl(fileUrl: string): Promise<void> {
  // Poderia implementar uma rota no backend ou apenas não fazer nada
  console.log(`Deleção de ${fileUrl} não é mais feita diretamente pelo frontend.`);
}