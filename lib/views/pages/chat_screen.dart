// lib/views/pages/chat_screen.dart
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:http/http.dart' as http;
import '../../viewmodels/auth_viewmodel.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({Key? key}) : super(key: key);

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  List<Map<String, dynamic>> conversations = [];
  List<Map<String, dynamic>> messages = [];
  int? selectedConversationId;
  bool _isLoading = false;
  bool _loadingConversations = false;

  final String _baseUrl = 'http://10.0.2.2:3000/api';

  String? _getToken() {
    try {
      final auth = Provider.of<AuthViewModel>(context, listen: false);
      return auth.token;
    } catch (_) {
      return null;
    }
  }

  bool get isWide => MediaQuery.of(context).size.width >= 800;

  @override
  void initState() {
    super.initState();
    _loadConversations();
  }

  Future<Map<String, String>> _authHeaders() async {
    final token = _getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token != null ? 'Bearer $token' : '',
    };
  }

  // ---------------------------
  // Chargement des conversations
  // ---------------------------
  Future<void> _loadConversations() async {
    setState(() => _loadingConversations = true);
    try {
      final headers = await _authHeaders();
      final res = await http.get(Uri.parse('$_baseUrl/chat/conversations'), headers: headers);

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final list = data['conversations'] as List? ?? [];
        conversations = list.map<Map<String, dynamic>>((c) {
          final msgs = c['messages'] as List? ?? [];
          return {
            'id': c['id'],
            'title': c['title'] ?? 'Conversation ${c['id']}',
            'lastMessage': msgs.isNotEmpty ? msgs.last['content'] : '',
            'updatedAt': c['updatedAt'] ?? c['createdAt'] ?? '',
          };
        }).toList();

        conversations.sort((a, b) => b['updatedAt'].compareTo(a['updatedAt']));

        if (conversations.isNotEmpty && selectedConversationId == null) {
          await _selectConversation(conversations[0]['id']);
        }
      } else {
        _showSnack('Erreur chargement conversations: ${res.statusCode}');
      }
    } catch (e) {
      _showSnack('Erreur réseau: $e');
    } finally {
      setState(() => _loadingConversations = false);
    }
  }

  // ---------------------------
  // Sélection d'une conversation
  // ---------------------------
  Future<void> _selectConversation(int conversationId) async {
    setState(() {
      selectedConversationId = conversationId;
      messages = [];
      _isLoading = true;
    });

    try {
      final headers = await _authHeaders();
      final res = await http.get(Uri.parse('$_baseUrl/chat/conversations/$conversationId/messages'), headers: headers);

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final list = data['messages'] as List? ?? [];
        messages = list.map<Map<String, dynamic>>((m) {
          return {
            'id': m['id'],
            'sender': m['sender'],
            'content': m['content'],
            'created_at': m['created_at'] ?? m['createdAt'],
          };
        }).toList();
        _scrollToBottom();
      } else {
        _showSnack('Erreur chargement messages: ${res.statusCode}');
      }
    } catch (e) {
      _showSnack('Erreur réseau: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  // ---------------------------
  // Supprimer conversation
  // ---------------------------
  Future<void> _deleteConversation(int conversationId) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Supprimer la conversation'),
        content: const Text('Voulez-vous vraiment supprimer cette conversation ?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Annuler')),
          ElevatedButton(onPressed: () => Navigator.pop(context, true), child: const Text('Supprimer')),
        ],
      ),
    );
    if (ok != true) return;

    try {
      final headers = await _authHeaders();
      final res = await http.delete(Uri.parse('$_baseUrl/chat/conversations/$conversationId'), headers: headers);

      if (res.statusCode == 200 || res.statusCode == 204) {
        conversations.removeWhere((c) => c['id'] == conversationId);
        if (selectedConversationId == conversationId) {
          selectedConversationId = conversations.isNotEmpty ? conversations[0]['id'] : null;
          if (selectedConversationId != null) await _selectConversation(selectedConversationId!);
          else setState(() => messages = []);
        }
        setState(() {});
        _showSnack('Conversation supprimée');
      } else {
        _showSnack('Erreur suppression: ${res.statusCode}');
      }
    } catch (e) {
      _showSnack('Erreur réseau: $e');
    }
  }

  // ---------------------------
  // Envoyer un message
  // ---------------------------
  Future<void> _sendMessage(String text) async {
    final trimmed = text.trim();
    if (trimmed.isEmpty) return;

    setState(() {
      messages.add({'sender': 'user', 'content': trimmed, 'temp': true});
      _controller.clear();
      _isLoading = true;
    });
    _scrollToBottom();

    try {
      final headers = await _authHeaders();
      final body = jsonEncode({'message': trimmed});
      final res = await http.post(Uri.parse('$_baseUrl/chat'), headers: headers, body: body);

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final reply = data['reply'] ?? 'Je n\'ai pas compris.';
        final convId = data['conversation_id'] ?? selectedConversationId;

        await _loadConversations();
        if (convId != null) {
          selectedConversationId = convId;
          await _selectConversation(convId);
        }
      } else {
        _showSnack('Erreur serveur: ${res.statusCode}');
        setState(() {
          messages.add({'sender': 'bot', 'content': 'Erreur serveur: ${res.statusCode}'});
        });
      }
    } catch (e) {
      _showSnack('Erreur réseau: $e');
      setState(() {
        messages.add({'sender': 'bot', 'content': 'Erreur réseau: $e'});
      });
    } finally {
      setState(() => _isLoading = false);
      _scrollToBottom();
    }
  }

  // ---------------------------
  // UI Helpers
  // ---------------------------
  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _showSnack(String text) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));
  }

  Widget _buildMessageBubble(String text, bool isUser) {
    final align = isUser ? Alignment.centerRight : Alignment.centerLeft;
    final color = isUser ? Colors.deepPurple : Colors.grey[200];
    final textColor = isUser ? Colors.white : Colors.black87;

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 6),
      child: Align(
        alignment: align,
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
          child: DecoratedBox(
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(isUser ? 12 : 4),
                topRight: Radius.circular(isUser ? 4 : 12),
                bottomLeft: const Radius.circular(12),
                bottomRight: const Radius.circular(12),
              ),
              boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 2))],
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              child: Text(text, style: TextStyle(color: textColor, fontSize: 15)),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildConversationsList() {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
          child: Row(
            children: [
              const Expanded(child: Text('Conversations', style: TextStyle(fontWeight: FontWeight.bold))),
              IconButton(icon: const Icon(Icons.refresh), onPressed: _loadConversations, tooltip: 'Rafraîchir'),
            ],
          ),
        ),
        const Divider(height: 1),
        Expanded(
          child: _loadingConversations
              ? const Center(child: CircularProgressIndicator())
              : ListView.separated(
                  itemCount: conversations.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (context, index) {
                    final c = conversations[index];
                    final id = c['id'] as int?;
                    final selected = id != null && id == selectedConversationId;
                    return ListTile(
                      selected: selected,
                      leading: CircleAvatar(child: Text((index + 1).toString())),
                      title: Text(c['title'] ?? 'Conversation'),
                      subtitle: Text(c['lastMessage'] ?? '', maxLines: 1, overflow: TextOverflow.ellipsis),
                      trailing: IconButton(
                        icon: const Icon(Icons.delete_outline),
                        onPressed: id == null ? null : () => _deleteConversation(id),
                      ),
                      onTap: id == null
                          ? null
                          : () async {
                              if (!isWide) _scaffoldKey.currentState?.openDrawer();
                              await _selectConversation(id);
                            },
                    );
                  },
                ),
        ),
        Container(
          padding: const EdgeInsets.all(12),
          child: ElevatedButton.icon(
            onPressed: () {
              setState(() {
                selectedConversationId = null;
                messages = [];
              });
            },
            icon: const Icon(Icons.add_comment_outlined),
            label: const Text('Nouvelle conversation'),
            style: ElevatedButton.styleFrom(minimumSize: const Size.fromHeight(44)),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      appBar: AppBar(
        title: const Text('ChatBot Tungo'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _loadConversations, tooltip: 'Rafraîchir'),
          IconButton(
              icon: const Icon(Icons.delete_outline),
              onPressed: selectedConversationId == null ? null : () => _deleteConversation(selectedConversationId!),
              tooltip: 'Supprimer conversation'),
        ],
      ),
      drawer: isWide ? null : Drawer(child: _buildConversationsList()),
      body: Row(
        children: [
          if (isWide)
            Container(
              width: 320,
              decoration: BoxDecoration(
                  border: Border(right: BorderSide(color: Colors.grey.shade200)),
                  color: Theme.of(context).colorScheme.surface),
              child: _buildConversationsList(),
            ),
          Expanded(
            child: Column(
              children: [
                // header
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: Theme.of(context).appBarTheme.backgroundColor,
                    border: Border(bottom: BorderSide(color: Colors.grey.shade200)),
                  ),
                  child: Row(
                    children: [
                      CircleAvatar(backgroundColor: Colors.deepPurple, child: const Icon(Icons.support_agent, color: Colors.white)),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              selectedConversationId == null
                                  ? 'Nouvelle conversation'
                                  : (conversations.firstWhere(
                                          (c) => c['id'] == selectedConversationId,
                                          orElse: () => {'title': 'Conversation'}))['title'],
                              style: const TextStyle(fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              selectedConversationId == null ? 'Posez votre question' : 'Conversation ouverte',
                              style: const TextStyle(fontSize: 12, color: Colors.black54),
                            ),
                          ],
                        ),
                      ),
                      if (!isWide)
                        IconButton(
                          icon: const Icon(Icons.chat_outlined),
                          onPressed: () => _scaffoldKey.currentState?.openDrawer(),
                        )
                    ],
                  ),
                ),
                Expanded(
                  child: _isLoading
                      ? const Center(child: CircularProgressIndicator())
                      : messages.isEmpty
                          ? Center(child: Text('Aucun message. Commencez par envoyer une question.', style: TextStyle(color: Colors.grey[600])))
                          : ListView.builder(
                              controller: _scrollController,
                              padding: const EdgeInsets.all(12),
                              itemCount: messages.length,
                              itemBuilder: (context, index) {
                                final m = messages[index];
                                final isUser = (m['sender'] ?? '').toString().toLowerCase() == 'user';
                                return _buildMessageBubble(m['content'] ?? '', isUser);
                              },
                            ),
                ),
                SafeArea(
                  top: false,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    color: Theme.of(context).scaffoldBackgroundColor,
                    child: Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _controller,
                            textInputAction: TextInputAction.send,
                            onSubmitted: (v) => _sendMessage(v),
                            decoration: InputDecoration(
                              hintText: 'Posez votre question au chatbot...',
                              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                              filled: true,
                              fillColor: Colors.grey.shade100,
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(30),
                                borderSide: BorderSide.none,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        FloatingActionButton(
                          heroTag: 'send_btn',
                          mini: true,
                          onPressed: _isLoading ? null : () => _sendMessage(_controller.text),
                          child: _isLoading ? const CircularProgressIndicator(color: Colors.white) : const Icon(Icons.send),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
