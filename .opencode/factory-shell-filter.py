import ctypes
import errno
import socket


class Argument(ctypes.Structure):
    _fields_ = [
        ("index", ctypes.c_uint),
        ("comparison", ctypes.c_int),
        ("value", ctypes.c_uint64),
        ("mask_value", ctypes.c_uint64),
    ]


seccomp = ctypes.CDLL("libseccomp.so.2")
seccomp.seccomp_init.argtypes = [ctypes.c_uint32]
seccomp.seccomp_init.restype = ctypes.c_void_p
seccomp.seccomp_syscall_resolve_name.argtypes = [ctypes.c_char_p]
seccomp.seccomp_rule_add_array.argtypes = [
    ctypes.c_void_p, ctypes.c_uint32, ctypes.c_int, ctypes.c_uint, ctypes.POINTER(Argument),
]
seccomp.seccomp_export_bpf.argtypes = [ctypes.c_void_p, ctypes.c_int]

rules = seccomp.seccomp_init(0x7FFF0000)  # SCMP_ACT_ALLOW
deny = 0x00050000 | errno.EPERM  # SCMP_ACT_ERRNO
unix_socket = Argument(0, 4, socket.AF_UNIX, 0)  # SCMP_CMP_EQ
if not rules:
    raise SystemExit("Could not initialize the factory shell filter")

# Block pathname Unix sockets as well as alternate socket calls through io_uring.
for name, argument in ((b"socket", unix_socket), (b"io_uring_setup", None)):
    syscall = seccomp.seccomp_syscall_resolve_name(name)
    if seccomp.seccomp_rule_add_array(rules, deny, syscall, int(argument is not None),
                                     ctypes.byref(argument) if argument is not None else None) < 0:
        raise SystemExit(f"Could not restrict {name.decode()}")

if seccomp.seccomp_export_bpf(rules, 1) < 0:
    raise SystemExit("Could not export the factory shell filter")
