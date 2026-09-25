import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Sparkles, 
  Key, 
  Check, 
  ArrowRight, 
  Bot, 
  User, 
  HelpCircle,
  FileCheck
} from 'lucide-react';
import { DocumentRecord } from '../../types';
import { askAiAssistant, generateDocumentFromPrompt, hasAiConfigured } from '../../services/aiService';
import { getSettings, saveSettings } from '../../services/storageService';

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentDoc: DocumentRecord;
  onApplyDoc: (doc: Partial<DocumentRecord>) => void;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  generatedDoc?: Partial<DocumentRecord>;
  timestamp: string;
}

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({
  isOpen,
  onClose,
  currentDoc,
  onApplyDoc
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'ai',
      text: `Hello! I am your MG Supplytech AI Commercial Assistant. I can generate complete quotations, calculate export pricing, verify Incoterms, enhance product descriptions, or draft high-converting client emails. How can I help you today?`,
      timestamp: 'Just now'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKeyConfig, setShowKeyConfig] = useState(!hasAiConfigured());

  if (!isOpen) return null;

  const handleSaveKey = () => {
    if (!apiKeyInput.trim()) return;
    const settings = getSettings();
    saveSettings({ ...settings, geminiApiKey: apiKeyInput.trim() });
    setShowKeyConfig(false);
    setApiKeyInput('');
  };

  const handleSend = async (customPrompt?: string) => {
    const promptToSend = customPrompt || input;
    if (!promptToSend.trim() || loading) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: promptToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customPrompt) setInput('');
    setLoading(true);

    try {
      // Check if user is asking to generate a quote or document
      const lower = promptToSend.toLowerCase();
      if (lower.includes('generate') || lower.includes('create') || lower.includes('quote') || lower.includes('offer')) {
        try {
          const docData = await generateDocumentFromPrompt(promptToSend, currentDoc.docType);
          const aiMsg: Message = {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: `I've prepared a commercial document matching your request for **${docData.customerName || 'your customer'}**. Click the button below to apply this directly into your active document editor:`,
            generatedDoc: docData,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, aiMsg]);
          setLoading(false);
          return;
        } catch (e) {
          // fallback to general chat
        }
      }

      const response = await askAiAssistant(promptToSend, currentDoc);
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: `⚠️ **Error**: ${err.message || 'Could not connect to Gemini API'}. Please ensure your API key is valid.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white dark:bg-[#152220] h-full shadow-2xl flex flex-col border-l border-[#D9DEDB] dark:border-[#223531]">
        {/* Header */}
        <div className="px-4 py-3.5 bg-[#014136] text-white flex items-center justify-between border-b border-[#DFBC64]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#DFBC64] text-[#003A30]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-sm leading-tight text-white flex items-center gap-1.5">
                <span>MG Supplytech AI Assistant</span>
              </div>
              <div className="text-[10px] text-[#DFBC64] font-medium tracking-wide">
                Powered by Gemini 2.5 &bull; Commercial Sourcing Intelligence
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowKeyConfig(!showKeyConfig)}
              className="p-1 text-[#DFBC64] hover:text-white"
              title="Configure Gemini API Key"
            >
              <Key className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1 text-white/80 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* API Key Banner / Config */}
        {showKeyConfig && (
          <div className="p-3 bg-[#F6F7F5] dark:bg-[#101b19] border-b border-[#D9DEDB] dark:border-[#223531]">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#014136] dark:text-[#DFBC64] mb-1">
              <Key className="w-3.5 h-3.5" />
              <span>Gemini API Key Configuration</span>
            </div>
            <p className="text-[11px] text-[#65716D] mb-2">
              Enter your Gemini API key from Google AI Studio to unlock smart document generation across the entire app.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="AIzaSy..."
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="flex-1 px-2.5 py-1.5 text-xs bg-white dark:bg-[#152220] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg"
              />
              <button
                onClick={handleSaveKey}
                className="px-3 py-1.5 bg-[#014136] text-[#DFBC64] font-bold text-xs rounded-lg hover:bg-[#002e27]"
              >
                Save
              </button>
            </div>
          </div>
        )}

        {/* Quick Prompt Pills */}
        <div className="px-3 py-2 bg-[#F6F7F5] dark:bg-[#101b19] border-b border-[#D9DEDB] dark:border-[#223531] overflow-x-auto flex gap-1.5 no-scrollbar">
          {[
            "Create export quote for UAE",
            "Generate Price Offer for Cerium",
            "Explain FOB vs CIF Incoterms",
            "Check export checklist"
          ].map((promptText) => (
            <button
              key={promptText}
              onClick={() => handleSend(promptText)}
              className="shrink-0 px-2.5 py-1 rounded-full text-[11px] bg-white dark:bg-[#1a2b28] border border-[#D9DEDB] dark:border-[#2a3f3b] text-[#43504B] dark:text-[#E3ECE8] hover:border-[#014136] font-medium transition"
            >
              {promptText}
            </button>
          ))}
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((msg) => {
            const isAi = msg.sender === 'ai';
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isAi ? 'justify-start' : 'justify-end'}`}
              >
                {isAi && (
                  <div className="w-7 h-7 rounded-full bg-[#014136] text-[#DFBC64] flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                    MG
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                    isAi
                      ? 'bg-[#F6F7F5] dark:bg-[#1a2b28] text-[#16211F] dark:text-[#E3ECE8] border border-[#D9DEDB] dark:border-[#2a3f3b]'
                      : 'bg-[#014136] text-white font-medium'
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.text}</div>

                  {/* If AI generated a document, show interactive Apply button */}
                  {msg.generatedDoc && (
                    <div className="mt-3 pt-2.5 border-t border-[#D9DEDB] dark:border-[#2a3f3b]">
                      <div className="font-bold text-[11px] text-[#014136] dark:text-[#DFBC64] mb-1 flex items-center gap-1">
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>Ready Document Payload</span>
                      </div>
                      <div className="text-[10px] text-[#65716D] mb-2">
                        {msg.generatedDoc.items?.length || 0} items &bull; Customer: {msg.generatedDoc.customerName} &bull; {msg.generatedDoc.currency}
                      </div>
                      <button
                        onClick={() => {
                          onApplyDoc(msg.generatedDoc!);
                          onClose();
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-[#014136] hover:bg-[#002e27] text-[#DFBC64] font-bold rounded-lg text-xs transition"
                      >
                        <span>Apply to Active Editor</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="mt-1 text-[9px] text-[#65716D] text-right">
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-2.5 justify-start">
              <div className="w-7 h-7 rounded-full bg-[#014136] text-[#DFBC64] flex items-center justify-center shrink-0 text-xs font-bold animate-pulse">
                MG
              </div>
              <div className="p-3 bg-[#F6F7F5] dark:bg-[#1a2b28] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-xl text-xs text-[#65716D] flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-[#DFBC64]" />
                <span>MG Commercial AI is formulating response...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white dark:bg-[#152220] border-t border-[#D9DEDB] dark:border-[#223531]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder="E.g. Create a quotation for 200kg Cerium Oxide for Metro Glass..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-3 py-2 text-xs bg-[#F6F7F5] dark:bg-[#101b19] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#014136]"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl bg-[#014136] text-[#DFBC64] hover:bg-[#002e27] disabled:opacity-40 transition font-bold"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
