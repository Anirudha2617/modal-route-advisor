// src/lib/api.ts

export interface BackendAIModel { // EXPORTED
  id: number;
  name: string;
  cost_per_token_text: string | null;
  cost_per_token_image: string | null;
  cost_per_token_audio: string | null;
  cost_per_token_video: string | null;
  cost_per_token_doc: string | null;
  supported_modalities: {
    types: string[];
  };
  provider: number; // This is the provider ID from the backend
  provider_name?: string; // We'll add this manually for display purposes if needed
}

export interface UserData {
  img: string | File | null;
  audio: string | File | null;
  vid: string | File | null;
  text: string;
  doc: string | File | null;
}

export interface AppContext {
  qaQuestions: string; // List of questions for QA tasks
  tasks: string[];
  text: string[];
}

export interface ExperimentPayload {
  data: UserData;
  context: AppContext;
  models: number[]; // List of model IDs
}

export interface ModalityResult {
  modality: string;
  tokens_used: number;
  time_taken_s: number;
  cost_usd: number;
  accuracy_score: number;
  performance_score: number;
}

export interface ExperimentResultItem {
  task_id: number;
  provider_name: string;
  model_name: string;
  modalities: ModalityResult[];
}

export type ExperimentResults = ExperimentResultItem[];

const API_BASE_URL = "http://127.0.0.1:8000/api";

export const fetchModels = async (): Promise<BackendAIModel[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/models/`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: BackendAIModel[] = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching models:", error);
    // Optionally rethrow or return a specific error object
    return [];
  }
};

// src/lib/api.ts

export const runExperiment = async (payload: ExperimentPayload): Promise<ExperimentResults | null> => {
  try {
    const formData = new FormData();

    // 1. Append selected tasks to the FormData
    payload.context.tasks.forEach((taskId, index) => {
      formData.append(`tasks[${index}]`, taskId);
    });

    // 2. Append the QA questions if the task is selected
    if (payload.context.text.length > 0) {
      payload.context.text.forEach((question, index) => {
        formData.append(`qa_questions[${index}]`, question);
      });
    }

    // 3. Append models
    payload.models.forEach((modelId, index) => {
      formData.append(`model_ids[${index}]`, modelId.toString());
    });

    // 4. Append text content
    if (payload.data.text) {
      formData.append('text_content', payload.data.text);
    }

    // 5. Append file data, handling null values safely
    if (payload.data.img instanceof File) formData.append('image_file', payload.data.img);
    else if (typeof payload.data.img === 'string') formData.append('image_url', payload.data.img);
    
    if (payload.data.audio instanceof File) formData.append('audio_file', payload.data.audio);
    else if (typeof payload.data.audio === 'string') formData.append('audio_url', payload.data.audio);

    if (payload.data.vid instanceof File) formData.append('video_file', payload.data.vid);
    else if (typeof payload.data.vid === 'string') formData.append('video_url', payload.data.vid);
    
    if (payload.data.doc instanceof File) formData.append('document_file', payload.data.doc);
    else if (typeof payload.data.doc === 'string') formData.append('document_url', payload.data.doc);
    console.log("FormData entries:" , Array.from(formData.entries()));
      // 6. Make the POST request to run the experiment

    const response = await fetch(`${API_BASE_URL}/run-experiment/`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    const data: ExperimentResults = await response.json();
    console.log("Experiment results:", data);
    return data;
  } catch (error) {
    console.error("Error running experiment:", error);
    throw error;
  }
};